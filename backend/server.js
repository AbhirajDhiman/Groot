const express = require("express");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const { initRepo } = require("./controllers/init");
const { addFile } = require("./controllers/add");
const { commitChanges } = require("./controllers/commit");
const { pullRepo } = require("./controllers/pull");
const { pushChanges } = require("./controllers/push");
const { revertCommit } = require("./controllers/revert");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

function startServer() {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

const parser = yargs(hideBin(process.argv))
  .command("init", "Initialize a new repository", () => {}, async () => {
    await initRepo();
    process.exit(0);
  })
  .command(
    "add <file..>",
    "Add a new file to the repository",
    (yargs) => {
      yargs.positional("file", {
        describe: "File to add to the staging area",
        type: "string",
        array: true,
      });
    },
    async (argv) => {
      const fileArg = process.argv.slice(3).join(" ");
      await addFile(fileArg);
      process.exit(0);
    }
  ).command(
    "pull",
    "Pull the latest changes from the remote repository",
    () => {},
    async () => {
      await pullRepo();
      process.exit(0);
    }
  ).command(
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
  ).command(
    "push",
    "Push the local changes to the remote repository",
    () => {},
    async () => {
      await pushChanges();
      process.exit(0);
    }
  ).command(
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
    startServer();
  }
})();
