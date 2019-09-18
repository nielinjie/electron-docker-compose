# Electron-Docker-Compose

本项目是一个骨架项目，目的是快速开发一个应用，前端是Electron，后端是一组docker容器。

Electron作为一个浏览器展现应用界面，所需页面全部从后端docker容器中获得。同时Electron提供基本的本地操作系统支持，比如管理容器的启停，获得可用端口、本地存储等。后端的docker容器内，提供其他一切。

*感谢 [electron-vue-spring](https://github.com/wuruoyun/electron-vue-spring) ，本项目从此更改而来。*



## 前置条件

* Window 和 Mac OS。Linux理论上支持，没有测试。
* 可用的`docker-compose`，当然也包括其后的`docker`，在桌面环境中可以通过docker-desktop之类的工具获得。

## 可定制

* 通过`./electron/customize.js`提供，可以定制主URL，健康URL。
* 通过`./electron/splash.html`，可以定制预加载窗口外观。
* （通过源代码，可以定制一切。）

## 构建安装程序

Build the final installer, which can be found in folder `dist`. It is an `exe` file for Windows and `dmg` file for Mac.

``` bash
# install dependencies
npm install

# build installer for production
npm run build
```

## 开发环境

开发过程中，docker-compose和electron是两个单独的部分，可以单独开发调试。

* `./docker-compose/docker-compose.yml`就是一个普通的docker-compose文件，随时可以单独运行。
* 根目录运行`npm run start`将单独运行electron，不会试图启动docker-compose。



## 原理

### 构建过程

Electorn构建过程中会把`./docker-compose/docker-compose.yml`copy到安装包，以便在运行时使用。

### 启动过程

1. Electron会寻找一个可用端口，传递到docker-compose，启动docker-compose。记下PID。
2. Electron显示预加载窗口，同时轮训健康URL。
3. 当健康URL返回OK，Electron切换到主URL。
4. （Electron退出时），根据PID kill，然后运行`docker-compose ... down`

> 只有在生产环境才会自动启停docker-compose，开发环境的时候需要手动启动docker-compose。



## License

[MIT](LICENSE)