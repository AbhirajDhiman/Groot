const express = require('express');
const http = require('http');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');

// Load environment configuration
dotenv.config();

// Import Version Control System controllers
const { initRepo } = require('./controllers/init');
const { addFile } = require('./controllers/add');
const { commitChanges } = require('./controllers/commit');
const { showLog } = require('./controllers/log');
const { repoStatus } = require('./controllers/status');
const { diffRepo } = require('./controllers/diff');
const { pullRepo } = require('./controllers/pull');
const { pushChanges } = require('./controllers/push');
const { revertCommit } = require('./controllers/revert');

// Import API routes
const mainRouter = require('./routes/main.router');

// Optional Socket.io support
let SocketServer = null;
try {
  SocketServer = require('socket.io').Server;
} catch {
  // socket.io not installed, fallback gracefully
}

function createGrootApp() {
  const app = express();

  app.use(cors({ origin: '*' }));
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.json());

  // Mount API routes
  app.use('/api', mainRouter);
  app.use('/', mainRouter);

  return app;
}

const app = createGrootApp();

async function startServer(customPort = null) {
  const port = customPort || process.env.PORT || 3000;
  const mongoUri =
    process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/groot';

  console.log('Connecting to Groot MongoDB database...');
  try {
    await mongoose.connect(mongoUri);
    console.log('Successfully connected to MongoDB!');
  } catch (err) {
    console.warn(`Warning: Could not connect to MongoDB (${err.message}). API endpoints requiring database will fail.`);
  }

  const httpServer = http.createServer(app);

  if (SocketServer) {
    const io = new SocketServer(httpServer, {
      cors: { origin: '*', methods: ['GET', 'POST'] },
    });

    io.on('connection', (socket) => {
      console.log(`Groot client connected: ${socket.id}`);

      socket.on('joinRoom', (roomID) => {
        socket.join(roomID);
        console.log(`Socket ${socket.id} joined room: ${roomID}`);
      });

      socket.on('disconnect', () => {
        console.log(`Groot client disconnected: ${socket.id}`);
      });
    });
  }

  return new Promise((resolve) => {
    httpServer.listen(port, () => {
      console.log(`\n🌳 Groot VCS Backend Server is listening on http://localhost:${port}`);
      console.log(`  - API Health: http://localhost:${port}/api`);
      console.log(`  - VCS Status: http://localhost:${port}/api/vcs/status\n`);
      resolve(httpServer);
    });
  });
}

// Setup CLI command parsing with yargs
const parser = yargs(hideBin(process.argv))
  .scriptName('groot')
  .usage('$0 <command> [options]')
  .command(
    'start',
    'Start the Groot backend server and API daemon',
    (y) => {
      y.option('port', {
        alias: 'p',
        describe: 'Port to bind server to',
        type: 'number',
      });
    },
    async (argv) => {
      await startServer(argv.port);
    }
  )
  .command(
    'init [dir]',
    'Initialize a new Groot repository',
    (y) => {
      y.positional('dir', {
        describe: 'Directory to initialize repository in',
        type: 'string',
        default: '.',
      });
    },
    async (argv) => {
      await initRepo(argv.dir);
      process.exit(0);
    }
  )
  .command(
    'add <files..>',
    'Stage files or directories for the next commit',
    (y) => {
      y.positional('files', {
        describe: 'File or directory path(s) to stage (or "." for all files)',
        type: 'string',
        array: true,
      });
    },
    async (argv) => {
      await addFile(argv.files);
      process.exit(0);
    }
  )
  .command(
    'commit <message>',
    'Record staged snapshots to the repository history',
    (y) => {
      y.positional('message', {
        describe: 'Commit message describing the changes',
        type: 'string',
      });
      y.option('author', {
        alias: 'a',
        describe: 'Author name for the commit',
        type: 'string',
      });
    },
    async (argv) => {
      await commitChanges(argv.message, { author: argv.author });
      process.exit(0);
    }
  )
  .command(
    'status',
    'Show working tree and staging status',
    () => {},
    async () => {
      await repoStatus();
      process.exit(0);
    }
  )
  .command(
    'log',
    'Show commit logs and version history',
    (y) => {
      y.option('limit', {
        alias: 'n',
        describe: 'Number of commits to show',
        type: 'number',
      });
    },
    async (argv) => {
      await showLog({ limit: argv.limit });
      process.exit(0);
    }
  )
  .command(
    'diff [file]',
    'Show changes between commits, commit and working tree, etc.',
    (y) => {
      y.positional('file', {
        describe: 'Specific file to compare',
        type: 'string',
      });
      y.option('commitA', {
        describe: 'First commit ID to compare',
        type: 'string',
      });
      y.option('commitB', {
        describe: 'Second commit ID to compare',
        type: 'string',
      });
    },
    async (argv) => {
      await diffRepo(argv.file, argv.commitA, argv.commitB);
      process.exit(0);
    }
  )
  .command(
    'revert <commitID>',
    'Restore workspace files from a previous commit snapshot',
    (y) => {
      y.positional('commitID', {
        describe: 'Commit ID or prefix to revert to',
        type: 'string',
      });
    },
    async (argv) => {
      await revertCommit(argv.commitID);
      process.exit(0);
    }
  )
  .command(
    'push',
    'Push local commits to remote storage (AWS S3)',
    () => {},
    async () => {
      await pushChanges();
      process.exit(0);
    }
  )
  .command(
    'pull',
    'Pull remote commits from storage (AWS S3)',
    () => {},
    async () => {
      await pullRepo();
      process.exit(0);
    }
  )
  .help()
  .strict();

// Execute CLI or start server if invoked without commands
if (require.main === module) {
  (async () => {
    const argv = await parser.parse();
    if (argv._.length === 0) {
      await startServer();
    }
  })();
}

module.exports = {
  app,
  createGrootApp,
  startServer,
};