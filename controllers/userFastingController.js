const time = require("./../libs/timeLib");
const apiResponseFormat = require("../libs/responseLib");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { request } = require("http");

const dbPath = path.join(__dirname, "../boltfasting.db");

let db = null;

const initializeDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

const createUserFastingHistory = async (request, response) => {
  await initializeDB();
  const { userId, startTime, endTime, goalTime, fastingTime } = request.body;
  // console.log(request.body);
  let is_goal_accomplished = fastingTime > goalTime * 3600;
  const selectUserFastingHistoryQuery = `SELECT * FROM user_fasting_history WHERE user_id = ${userId} and started_at = ${startTime}`;
  try {
    const dbResult = await db.get(selectUserFastingHistoryQuery);
    if (dbResult === undefined) {
      const createUserFastingHistoryQuery = `
                      INSERT INTO
                      user_fasting_history (user_id, started_at,ended_at, goal_time,is_goal_accomplished,fasting_time,created_on,updated_on)
                      VALUES
                      (
                          ${userId},
                          ${startTime},
                          ${endTime},
                          ${goalTime * 3600},
                          ${is_goal_accomplished ? 1 : 0},
                          ${fastingTime},
                          '${time.now()}',
                          '${time.now()}'
                      )`;

      let dbResponse = await db.run(createUserFastingHistoryQuery);
      dbResponse = { ...dbResponse, startTime: startTime };
      // const newUserId = dbResponse.lastID;
      let apiResponse = apiResponseFormat.generate(
        false,
        "User fasting history created",
        200,
        dbResponse
      );
      // console.log(apiResponse);
      response.send(apiResponse);
    } else {
      const updateUserFastingHistoryQuery = `
                        Update user_fasting_history
                        SET user_id = ${userId},
                            started_at = ${startTime},
                            ended_at = ${endTime},
                            goal_time = ${goalTime},
                            is_goal_accomplished = ${is_goal_accomplished},
                            fasting_time =${fastingTime},
                            updated_on = '${time.now()}'
                        WHERE user_id=${userId} and started_at =${startTime}
                        `;
      let dbResponse = await db.run(updateUserFastingHistoryQuery);
      dbResponse = { ...dbResponse, startTime: startTime };
      // const newUserId = dbResponse.lastID;
      let apiResponse = apiResponseFormat.generate(
        false,
        "User fasting history updated successfully",
        200,
        dbResponse
      );
      response.send(apiResponse);
    }
  } catch (error) {
    console.log(error);
    response.send(error);
    // await db.close();
  }
};

const createUserFastingDetails = async (request, response) => {
  await initializeDB();
  const { userId, startTime, endTime, fastingTime, goalTime } = request.body;
  let is_goal_accomplished = fastingTime > goalTime * 3600;
  // console.log(is_goal_accomplished);

  const selectUserFastingDetailQuery = `SELECT * FROM user_fasting_details WHERE user_id=${userId}`;
  try {
    const dbResult = await db.get(selectUserFastingDetailQuery);
    if (dbResult === undefined) {
      const createUserFastingDetailQuery = `
                      INSERT INTO
                      user_fasting_details (user_id, cur_started_at,cur_ended_at,total_fasts,avg_fast,longest_fast,
                        longest_streak,current_streak,created_on,updated_on)
                      VALUES
                      (
                          ${userId},
                          ${startTime},
                          ${endTime},
                          ${is_goal_accomplished ? 1 : 0},
                          ${fastingTime},
                          ${fastingTime},
                          ${is_goal_accomplished ? 1 : 0},
                          ${is_goal_accomplished ? 1 : 0},
                          '${time.now()}',
                          '${time.now()}'
                      )`;
      const dbResponse = await db.run(createUserFastingDetailQuery);
      // const newUserId = dbResponse.lastID;
      let apiResponse = apiResponseFormat.generate(
        false,
        "User fasting details created",
        200,
        dbResponse
      );
      response.send(apiResponse);
      // await db.close();
    } else {
      const {
        total_fasts,
        avg_fast,
        longest_fast,
        longest_streak,
        current_streak,
      } = dbResult;

      const updateUserFastingDetailQuery = `
                      Update user_fasting_details
                      SET cur_started_at = ${startTime},
                          cur_ended_at = ${endTime},
                          total_fasts = ${
                            is_goal_accomplished ? total_fasts + 1 : total_fasts
                          },
                          avg_fast =${Math.round((fastingTime + avg_fast) / 2)},
                          longest_fast = ${
                            fastingTime > longest_fast
                              ? fastingTime
                              : longest_fast
                          },
                         
                          longest_streak = ${
                            is_goal_accomplished
                              ? current_streak + 1 > longest_streak
                                ? current_streak + 1
                                : longest_streak
                              : longest_streak
                          },
                          current_streak = ${
                            is_goal_accomplished ? current_streak + 1 : 0
                          },
                          updated_on = '${time.now()}'
                      WHERE user_id=${userId}
                      `;
      let dbResponse = await db.run(updateUserFastingDetailQuery);
      // const newUserId = dbResponse.lastID;
      let apiResponse = apiResponseFormat.generate(
        false,
        "User fasting details updated successfully",
        200,
        dbResponse
      );
      response.send(apiResponse);
      // await db.close();
    }
  } catch (error) {
    console.log(error);
    response.send(error);
    // await db.close();
  }
};

const getUserFastingDetails = async (request, response) => {
  await initializeDB();

  const { userId } = request.params;
  const getUserFastingDataQuery = `
    SELECT
      user_id,
      total_fasts,
      avg_fast,
      longest_fast,
      longest_streak,
      current_streak
    FROM
      user_fasting_details
    WHERE
      user_id = ${userId};`;
  try {
    const dbResponse = await db.get(getUserFastingDataQuery);

    let apiResponse = apiResponseFormat.generate(
      false,
      "User fasting details retrieved successfully",
      200,
      dbResponse
    );

    response.send(apiResponse);
    // await db.close();
  } catch (error) {
    console.log(error);
    response.send(error);
    // await db.close();
  }
};
const getWeeklyFastingData = async (request, response) => {
  await initializeDB();
  const { userId } = request.params;
  const getWeeklyFastingDataQuery = `
    SELECT
      user_id,started_at,fasting_time
    FROM
      user_fasting_history
    WHERE
      user_id = ${userId} ORDER by started_at desc LIMIT 7`;

  try {
    const dbResponse = await db.all(getWeeklyFastingDataQuery);

    let apiResponse = apiResponseFormat.generate(
      false,
      "data retrieved successfully",
      200,
      dbResponse
    );
    response.send(apiResponse);
    // await db.close();
  } catch (error) {
    console.log(error);
    response.send(error);
    // await db.close();
  }
};

module.exports = {
  createUserFastingHistory: createUserFastingHistory,
  createUserFastingDetails: createUserFastingDetails,
  getUserFastingDetails: getUserFastingDetails,
  getWeeklyFastingData: getWeeklyFastingData,
};
