const express = require("express");

const userFastingController = require("../controllers/userFastingController");

// const auth = require("./../middlewares/auth");

module.exports.setRouter = (app) => {
  app.post(
    "/api/user/:userId/fastinghistory",
    userFastingController.createUserFastingHistory
  );

  app.post(
    "/api/user/:userId/fastingdetails",
    userFastingController.createUserFastingDetails
  );

  app.get(
    "/api/user/:userId/getfastingdetails",
    userFastingController.getUserFastingDetails
  );

  app.get(
    "/api/user/:userId/getweeklyfastingData",
    userFastingController.getWeeklyFastingData
  );
};
