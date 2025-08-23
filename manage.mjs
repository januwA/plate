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
          console.error(`创建${args[1]}失败：`, err);
        } else {
          fs.writeFileSync(
            path.join(dirName, 'main.tsx'),
            `import { Link, Route } from "react-router-dom";
const Main = () => {
    return <div> <h1>${args[1]}</h1> </div>
}

export const Settings = {
  menu_items: [
    {
      key: '${args[1]}',
      label: <Link to='${args[1]}'>${args[1]}</Link>,
    }
  ],
  route: <Route path='${args[1]}'>
    <Route index element={<Main />} />
  </Route>
}
`);
          console.log(`${args[1]}创建成功！`);
        }
      });
    } else if (err) {
      console.error('检查目录失败：', err);
    } else {
      console.log(`${args[1]}已存在，无需创建。`);
    }
  });
} else if (args[0] === 'fetchapp' && args[1]) {
  // 从git拉取app
  // node .\manage.mjs fetchapp https://github.com/januwA/action_game.git
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
