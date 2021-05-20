const validateInput = require("../libs/paramsValidation");
const bcrypt = require("bcrypt");
const time = require("./../libs/timeLib");
const apiResponseFormat = require("../libs/responseLib");
const jwt = require("jsonwebtoken");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

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

const signUpFunction = async (request, response) => {
  await initializeDB();

  const { firstName, lastName, email, password } = request.body;

  if (validateInput.Email(email)) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const selectUserQuery = `SELECT * FROM user_details WHERE email = '${email}'`;

    try {
      const dbUser = await db.get(selectUserQuery);
      if (dbUser === undefined) {
        const createUserQuery = `
                    INSERT INTO 
                    user_details (first_name, last_name,email, password,created_on) 
                    VALUES 
                    (
                        '${firstName}', 
                        '${lastName}',
                        '${email}', 
                        '${hashedPassword}',
                        '${time.now()}'
                    )`;
        const dbResponse = await db.run(createUserQuery);
        const newUserId = dbResponse.lastID;
        let apiResponse = apiResponseFormat.generate(
          false,
          "User created",
          200,
          newUserId
        );
        response.send(apiResponse);
        db.close();
      } else {
        response.status = 400;
        response.send("User already exists");
        // db.close();
      }
    } catch (error) {
      response.send(error);
      // db.close();
    }
  } else {
    response.status = 400;
    response.send("enter valid email address");
  }
};

const loginFunction = async (request, response) => {
  await initializeDB();

  const { email, password } = request.body;
  if (validateInput.Email(email)) {
    const selectUserQuery = `SELECT * FROM user_details WHERE email = '${email}'`;
    try {
      let dbUser = await db.get(selectUserQuery);
      if (dbUser === undefined) {
        response.status(400);
        response.send("Invalid User");
      } else {
        const isPasswordMatched = await bcrypt.compare(
          password,
          dbUser.password
        );
        if (isPasswordMatched === true) {
          const payload = {
            email: email,
          };
          const accessToken = jwt.sign(payload, "MY_SECRET_TOKEN");
          // console.log(dbUser);
          const userId = dbUser.id;

          let apiResponse = apiResponseFormat.generate(
            false,
            "login succesful",
            200,
            { accessToken: accessToken, userId: userId }
          );
          response.send(apiResponse);
          // db.close();
          //   response.send("login suceess");
          // response.send({ message: "login succesful", jwtToken: jwtToken });
        } else {
          response.status(400);
          response.send("Invalid Password");
          // db.close();
        }
      }
    } catch (error) {
      response.send(error);
      // db.close();
    }
  } else {
    response.status(400);
    response.send("Invalid email id");
  }
};

module.exports = {
  signUpFunction: signUpFunction,
  loginFunction: loginFunction,
};
