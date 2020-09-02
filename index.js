const fs = require("fs");
const http = require("http");

http
  .createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    let endMsg = JSON.stringify({
      message: "Request Finished"
    });
    let invalidMsg = JSON.stringify({
      message: "Invalid Method"
    });
    switch (req.url) {
      case "/":
        if (req.method !== "POST") {
          res.statusCode = 404;
          res.end(invalidMsg);
        }

        let body = "";
        req.on("data", chunk => {
          body += chunk.toString();
        });
        req.on("end", () => {
          let parsedBody = JSON.parse(body || {});
          let fileName = (parsedBody && parsedBody.file) || "default.txt";
          let data = (parsedBody && parsedBody.data) || {};

          fs.writeFile(fileName, JSON.stringify(data, null, 2), (err, _) => {
            if (err) {
              res.end(
                JSON.stringify({
                  message: "Writing file error"
                })
              );
            } else {
              res.end(JSON.stringify({ message: "finished" }));
            }
          });

          res.statusCode = 200;
          res.end(endMsg);
        });

      default:
        res.statusCode = 404;
        res.end(endMsg);
    }
  })
  .listen(8091, () => {
    console.log("running on 8091");
  });
