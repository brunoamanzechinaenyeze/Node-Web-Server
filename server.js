//WARNING!!! If you are a beginner in coding,  DO NOT READ!!!!!
// YOU WOULD SUFFER FROM SEVERE HEADACHE, NO JOKES!!!!

const http = require("http");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;

const logEvents = require(`./logEvents`);

// using Event Emitter in Node JS
const EventEmitter = require("events");

class Emitter extends EventEmitter {}

//Creating a new Emitter Object
const myEmitter = new Emitter();

myEmitter.on("log", (msg, fileName) => logEvents(msg, fileName));
const PORT = process.env.PORT || 4000;


//This is basically what is running in the node server
//I created a function and then passed it to the server
const serveFile = async (filePath, contentType, response) => {
  try {
    const rawData = await fsPromises.readFile(
      filePath,
      !contentType.includes("image") ? "utf-8" : ""
    );
    const data =
      contentType === "application/json" ? JSON.parse(rawData) : rawData;
    response.writeHead(filePath.includes("404.html") ? 404 : 200, {
      "Content-Type": contentType,
    });
    response.end(
      contentType === "application/json" ? JSON.stringify(data) : data
    );
  } catch (err) {
    console.log(err);
    //This is more like passing functions through
    myEmitter.emit("log", `${err.name}: ${err.message}`, `errLog.txt`);
    response.statusCode = 500;
    response.end();
  }
};

//Creating a node Server
const server = http.createServer((req, res) => {
  console.log(req.url, req.method);

  myEmitter.emit("log", `${req.url}\t${req.method}`, `reqLog.txt`);

  const extension = path.extname(req.url);

  let contentType;

  //Checking the extension types in the req.url
  switch (extension) {
    case ".css":
      contentType = "text/css";
      break;
    case ".js":
      contentType = "text/javascript";
      break;
    case ".json":
      contentType = "application/json";
      break;
    case ".jpg":
      contentType = "image/jpeg";
      break;
    case ".png":
      contentType = "image/png";
      break;
    case ".txt":
      contentType = "text/plain";
      break;
    default:
      contentType = "text/html";
  }

  let filePath;

  //if the content type is a html file, we set the path to the html files in the views folder
  if (contentType === "text/html") {
    if (req.url === "/") {
      filePath = path.join(__dirname, "views", "index.html");
    } else if (req.url.slice(-1) === "/") {
      filePath = path.join(__dirname, "views", req.url, "index.html");
    } else {
      filePath = path.join(__dirname, "views", req.url);
    }
  } else {
    filePath = path.join(__dirname, req.url);
  }


  //If the user does not provide the extension, we provide it by default
  if (!extension && req.url.slice(-1) !== "/")  filePath += ".html"

  //Checking if the file exists
  const fileExists = fs.existsSync(filePath);


  //This is actually where the whole server event is taking place
  if (fileExists) {

    //This is the server function we initialized at the top of this code
    serveFile(filePath, contentType, res);
  } else {
    //The base is a part of the parse property that contains the url of the page
    switch (path.parse(filePath).base) {
      case "old-page.html":
        res.writeHead(301, { Location: "/new-page.html" });
        res.end();
        break;
      case "www.page.html":
        res.writeHead(301, { Location: "/" });
        res.end();
        break;
      default:
        serveFile(path.join(__dirname, "views", "404.html"), "text/html", res);
    }
  }
});


//Hello, I am listening to the server
server.listen(PORT, (error) => {
  if (error) console.log(error);
  console.log(`Server running on port ${PORT}`);
});
