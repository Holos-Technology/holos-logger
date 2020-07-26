const log4js = require("log4js");

exports.InitLogger = function (app, filename, dirname, config) {
  if (!config.logLevel) {
    config.logLevel = "debug";
  }
  const pathLength = filename.replace(dirname + "/", "").split("/").length;
  const serviceName = dirname.split("/").pop();
  log4js.configure({
    appenders: {
      out: {
        type: "stdout",
        layout: {
          type: "pattern",
          pattern:
            "%[%d %p %c %X{Pid} (%X{SessionTrace}) %f{" +
            pathLength +
            "}:%l:%o %m%]",
        },
      },
    },
    categories: {
      default: {
        appenders: ["out"],
        level: config.logLevel,
        enableCallStack: true,
      },
    },
  });
  const logger = log4js.getLogger(serviceName);
  logger.addContext("Pid", process.pid);
  console.log = logger.info.bind(logger);
  console.error = logger.error.bind(logger);
  console.warn = logger.warn.bind(logger);

  // First middleware
  app.use(function (req, res, next) {
    logger.addContext("SessionTrace", req.headers["x-session-trace"]);
    // Morgan replacement to set logger unified
    if (req.method !== "OPTIONS")
      console.log(
        "Request ",
        req.method,
        " ",
        req.url,
        " from ",
        req.headers["referer"]
      );
    return next();
  });
  app.use(function(req, res, next){
    res.on('finish', function(){
      console.log("Ends with ", res.body);
    });
    next();
  });
};
