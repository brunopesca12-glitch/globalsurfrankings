import { ensureDemoJudgeStack } from "../lib/demo-judge-stack";

const email = process.argv[2] ?? "chamber.guest@gsr.surf";
ensureDemoJudgeStack(email).then((result) => {
  console.log(JSON.stringify(result));
  if (!result.ok) process.exit(1);
});
