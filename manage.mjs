import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { readdir, readFile } from 'node:fs/promises';
import process from 'node:process';
import semver from "semver";

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
} else if (args[0] === 'mergepackage') {
  // 合并每个app下的package.json到plate的package.json中去
  const dirName = path.resolve(import.meta.dirname, 'src/apps');

  const appsDirs = await readdir(dirName, { withFileTypes: true });

  // 过滤出所有是目录的项
  const appFolders = appsDirs.filter(dirent => dirent.isDirectory());

  const mergePkg = {
    dependencies: {},
    devDependencies: {}
  };

  // 读取appsyinai
  for (const folder of appFolders) {
    // 拼接每个子目录下的 package.json 路径
    const pkgPath = path.join(dirName, folder.name, 'package.json');

    try {
      // 尝试读取 package.json 文件内容
      const data = await readFile(pkgPath, 'utf8');
      const pkg = JSON.parse(data);
      mergeDep(pkg.dependencies, mergePkg.dependencies);
      mergeDep(pkg.devDependencies, mergePkg.devDependencies);
    } catch (err) {
      // 如果 package.json 文件不存在或读取失败，忽略并继续
      if (err.code === 'ENOENT') {
        console.warn(`Warning: No package.json found in ${folder.name}`);
        continue;
      }
      throw err; // 其他错误则抛出
    }
  }

  // 合并到/package.json
  console.log(mergePkg);
  
}

/**
 * 合并定义的依赖
 * 包名已存在，只留下版本号最大的包
 * @param {*} dep 
 * @param {*} mDep 
 */
function mergeDep(dep, mDep) {
  if (dep) {
    for (const key in dep) {
      if (mDep[key]) {
        const v = dep[key];
        const vOld = mDep[key];
        if (semver.gt(semver.coerce(v), semver.coerce(vOld))) {
          mDep[key] = dep[key];
        }
      } else {
        mDep[key] = dep[key];
      }
    }
  }
}
