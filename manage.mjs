import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// 忽略前两个元素（Node.js路径和脚本路径）
const args = process.argv.slice(2);


if (args[0] === 'startapp' && args[1]) {
  // 创建一个app
  // node .\manage.mjs startapp myapp

  const dirName = path.resolve(import.meta.dirname, 'src/apps', args[1]);

  // 检查目录是否存在，不存在则创建
  fs.stat(dirName, (err) => {
    if (err && err.code === 'ENOENT') {
      // 目录不存在，可以创建
      fs.mkdir(dirName, { recursive: true }, (err) => {
        if (err) {
          console.error('创建目录失败：', err);
        } else {
          fs.writeFileSync(
            path.join(dirName, 'main.tsx'),
            `export const Settings = {
  app_name: "${args[1]}"
}

export const Main = () => {
    return <div> <h1>${args[1]}</h1> </div>
}
`);
          console.log('目录创建成功！');
        }
      });
    } else if (err) {
      console.error('检查目录失败：', err);
    } else {
      console.log('目录已存在，无需创建。');
    }
  });
} else if (args[0] === 'fetchapp' && args[1]) {
  // 从git拉取app
  // node .\manage.mjs fetchapp 'https://januwA:<your token>@github.com/januwA/puzzle_game.git' 'https://github.com/januwA/action_game.git'
  const address = args.slice(1);
  for (const addr of address) {
    exec(`git clone ${addr} ./src/apps/${path.basename(addr, '.git')}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      if (stdout) console.log(`stdout: ${stdout}`);
      if (stderr) console.error(`stderr: ${stderr}`);
    });
  }
}
