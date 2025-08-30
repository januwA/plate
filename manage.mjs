import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { readdir, readFile } from 'node:fs/promises';
import process from 'node:process';
import semver from "semver";
import readline from 'readline';

/**
 * 管理脚本 - 用于管理plate项目中的应用
 * 
 * 支持的命令：
 * - startapp <app_name>    创建新的应用
 * - fetchapp <git_url>     从git仓库拉取应用
 * - mergepackage           合并所有应用的依赖到主项目
 */

// 获取命令行参数，忽略前两个元素（Node.js路径和脚本路径）
const args = process.argv.slice(2);

/**
 * 主函数 - 根据命令行参数执行相应的操作
 */
async function main() {
  try {
    if (args.length === 0) {
      showUsage();
      return;
    }

    const command = args[0];
    
    switch (command) {
      case 'startapp':
        if (!args[1]) {
          console.error('错误: 请提供应用名称');
          showUsage();
          return;
        }
        await createApp(args[1]);
        break;
        
      case 'fetchapp':
        if (!args[1]) {
          console.error('错误: 请提供git仓库地址');
          showUsage();
          return;
        }
        await fetchApps(args.slice(1));
        break;
        
      case 'mergepackage':
        await mergePackageDependencies();
        break;
        
      default:
        console.error(`未知命令: ${command}`);
        showUsage();
        break;
    }
  } catch (error) {
    console.error('执行过程中发生错误:', error);
    process.exit(1);
  }
}

/**
 * 显示使用说明
 */
function showUsage() {
  console.log(`
使用方法:
  node manage.mjs <command> [options]

可用命令:
  startapp <app_name>     创建新的应用
  fetchapp <git_url>      从git仓库拉取应用
  mergepackage            合并所有应用的依赖到主项目

示例:
  node manage.mjs startapp myapp
  node manage.mjs fetchapp https://github.com/user/repo.git
  node manage.mjs mergepackage
`);
}

/**
 * 创建新的应用
 * @param {string} appName - 应用名称
 */
async function createApp(appName) {
  const dirName = path.resolve(import.meta.dirname, 'src/apps', appName);
  
  try {
    // 检查目录是否存在
    const stats = await fs.promises.stat(dirName);
    if (stats.isDirectory()) {
      console.log(`${appName}已存在，无需创建。`);
      return;
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  try {
    // 创建应用目录
    await fs.promises.mkdir(dirName, { recursive: true });
    
    // 创建main.tsx文件
    const mainTsxContent = generateMainTsxContent(appName);
    await fs.promises.writeFile(
      path.join(dirName, 'main.tsx'),
      mainTsxContent
    );

    // 创建main.test.tsx文件
    const mainTestTsxContent = generateMainTestTsxContent(appName);
    await fs.promises.writeFile(
      path.join(dirName, 'main.test.tsx'),
      mainTestTsxContent
    );
    
    console.log(`${appName}创建成功！`);
  } catch (err) {
    console.error(`创建${appName}失败：`, err);
    throw err;
  }
}

/**
 * 生成main.tsx文件内容
 * @param {string} appName - 应用名称
 * @returns {string} 文件内容
 */
function generateMainTsxContent(appName) {
  return `import { Link, Route } from "react-router-dom";

export const Main = () => {
    return (
        <div>
            <h1>${appName}</h1>
        </div>
    );
};

export const Settings = {
    menu_items: [
        {
            key: '${appName}',
            label: <Link to='${appName}'>${appName}</Link>,
        }
    ],
    route: (
        <Route path='${appName}'>
            <Route index element={<Main />} />
        </Route>
    )
};
`;
}

/**
 * 生成main.test.tsx测试文件内容
 * @param {string} appName - 应用名称
 * @returns {string} 文件内容
 */
function generateMainTestTsxContent(appName) {
  return `import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Main } from "./main";

describe("Main Page", () => {
  it("h1", async () => {
    render(<Main />);
    expect(screen.getByText("${appName}")).toBeInTheDocument();
  });
})`;
}


/**
 * 从git仓库拉取应用
 * @param {string[]} gitUrls - git仓库地址数组
 */
async function fetchApps(gitUrls) {
  for (const gitUrl of gitUrls) {
    try {
      const appName = path.basename(gitUrl, '.git');
      const targetDir = path.resolve(import.meta.dirname, 'src/apps', appName);
      
      console.log(`正在拉取应用: ${appName}...`);
      
      // 执行git clone命令
      await executeCommand(`git clone ${gitUrl} ${targetDir}`);
      console.log(`${appName} 拉取成功！`);
    } catch (error) {
      console.error(`拉取应用失败 ${gitUrl}:`, error.message);
    }
  }
}

/**
 * 合并所有应用的依赖到主项目
 */
async function mergePackageDependencies() {
  try {
    const appsDir = path.resolve(import.meta.dirname, 'src/apps');
    
    // 读取apps目录下的所有子目录
    const appsDirs = await readdir(appsDir, { withFileTypes: true });
    const appFolders = appsDirs.filter(dirent => dirent.isDirectory());
    
    if (appFolders.length === 0) {
      console.log('没有找到任何应用目录');
      return;
    }
    
    // 初始化合并的依赖对象
    const mergedDependencies = {
      dependencies: {},
      devDependencies: {}
    };
    
    // 遍历每个应用目录，读取并合并package.json
    for (const folder of appFolders) {
      await mergeAppDependencies(folder.name, appsDir, mergedDependencies);
    }
    
    // 显示合并结果
    console.log('合并后的依赖:');
    console.log('生产依赖:', mergedDependencies.dependencies);
    console.log('开发依赖:', mergedDependencies.devDependencies);
    
    // 询问是否安装依赖
    await promptInstallDependencies(mergedDependencies);
    
  } catch (error) {
    console.error('合并依赖时发生错误:', error);
    throw error;
  }
}

/**
 * 合并单个应用的依赖
 * @param {string} appName - 应用名称
 * @param {string} appsDir - 应用目录路径
 * @param {Object} mergedDeps - 合并后的依赖对象
 */
async function mergeAppDependencies(appName, appsDir, mergedDeps) {
  const pkgPath = path.join(appsDir, appName, 'package.json');
  
  try {
    const data = await readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(data);
    
    // 合并生产依赖和开发依赖
    mergeDependencies(pkg.dependencies, mergedDeps.dependencies);
    mergeDependencies(pkg.devDependencies, mergedDeps.devDependencies);
    
    console.log(`✓ 已合并 ${appName} 的依赖`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(`⚠️  ${appName} 目录下没有找到 package.json`);
    } else {
      console.warn(`⚠️  读取 ${appName} 的 package.json 失败:`, err.message);
    }
  }
}

/**
 * 询问用户是否安装依赖
 * @param {Object} mergedDeps - 合并后的依赖对象
 */
async function promptInstallDependencies(mergedDeps) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('是否安装依赖? 输入 Y 继续, N 退出: ', async (answer) => {
      try {
        if (answer.trim().toLowerCase() === 'y') {
          await installDependencies(mergedDeps);
        } else {
          console.log('已取消安装依赖。');
        }
      } finally {
        rl.close();
        resolve();
      }
    });
  });
}

/**
 * 安装依赖
 * @param {Object} mergedDeps - 合并后的依赖对象
 */
async function installDependencies(mergedDeps) {
  try {
    // 构建依赖安装命令
    const deps = Object.entries(mergedDeps.dependencies)
      .map(([pkg, ver]) => `${pkg}@${ver}`)
      .join(" ");
    
    const devDeps = Object.entries(mergedDeps.devDependencies)
      .map(([pkg, ver]) => `${pkg}@${ver}`)
      .join(" ");
    
    console.log('正在安装生产依赖...');
    if (deps) {
      await executeCommand(`npm install ${deps}`);
    }
    
    console.log('正在安装开发依赖...');
    if (devDeps) {
      await executeCommand(`npm install -D ${devDeps}`);
    }
    
    console.log('所有依赖安装完成！');
  } catch (error) {
    console.error('安装依赖时出错:', error.message);
    throw error;
  }
}

/**
 * 执行shell命令
 * @param {string} command - 要执行的命令
 * @returns {Promise} 执行结果
 */
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`命令执行失败: ${error.message}`));
        return;
      }
      
      if (stdout) console.log(stdout);
      if (stderr) console.warn(stderr);
      
      resolve();
    });
  });
}

/**
 * 合并依赖对象
 * 如果包名已存在，只保留版本号最大的包
 * @param {Object} sourceDeps - 源依赖对象
 * @param {Object} targetDeps - 目标依赖对象
 */
function mergeDependencies(sourceDeps, targetDeps) {
  if (!sourceDeps) return;
  
  for (const [pkgName, version] of Object.entries(sourceDeps)) {
    if (targetDeps[pkgName]) {
      // 包已存在，比较版本号，保留较大的版本
      const currentVersion = targetDeps[pkgName];
      if (semver.gt(semver.coerce(version), semver.coerce(currentVersion))) {
        targetDeps[pkgName] = version;
      }
    } else {
      // 包不存在，直接添加
      targetDeps[pkgName] = version;
    }
  }
}

// 如果直接运行此脚本，则执行主函数

// 兼容Windows和Unix路径分隔符的判断
import { fileURLToPath } from 'url';

const isMain = (() => {
  const scriptPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
  const importPath = fileURLToPath(import.meta.url);
  return scriptPath === importPath;
})();

if (isMain) {
  main().catch(error => {
    console.error('程序执行失败:', error);
    process.exit(1);
  });
}
