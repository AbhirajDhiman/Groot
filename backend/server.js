const express = require("express");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");

dotenv.config();
const { initRepo } = require("./controllers/init");
const { addFile } = require("./controllers/add");
const { commitChanges } = require("./controllers/commit");
const { pullRepo } = require("./controllers/pull");
const { pushChanges } = require("./controllers/push");
const { revertCommit } = require("./controllers/revert");

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

async function startServer() {
  const port = process.env.PORT || 3000;
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/groot";

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
}

const parser = yargs(hideBin(process.argv))
  .command("start", "Start the backend server", () => {}, async () => {
    await startServer();
  })
  .command("init", "Initialize a new repository", () => {}, async () => {
    await initRepo();
    process.exit(0);
  })
  .command(
    "add <files..>",
    "Add one or more files to the repository",
    (yargs) => {
      yargs.positional("files", {
        describe: "Files to add to the staging area",
        type: "string",
        array: true,
      });
    },
    async (argv) => {
      await addFile(argv.files);
      process.exit(0);
    }
  )
  .command(
    "pull",
    "Pull the latest changes from the remote repository",
    () => {},
    async () => {
      await pullRepo();
      process.exit(0);
    }
  )
  .command(
    "commit <message>",
    "Commit the staged changes",
    (yargs) => {
      yargs.positional("message", {
        describe: "Commit message",
        type: "string",
      });
    },
    async (argv) => {
      await commitChanges(argv.message);
      process.exit(0);
    }
  )
  .command(
    "push",
    "Push the local changes to the remote repository",
    () => {},
    async () => {
      await pushChanges();
      process.exit(0);
    }
  )
  .command(
    "revert <commitHash>",
    "Revert a specific commit",
    (yargs) => {
      yargs.positional("commitHash", {
        describe: "Hash of the commit to revert",
        type: "string",
      });
    },
    async (argv) => {
      await revertCommit(argv.commitHash);
      process.exit(0);
    }
  )
  .help()
  .strict();

(async () => {
  const argv = await parser.parse();

  if (argv._.length === 0) {
    await startServer();
  }
})();