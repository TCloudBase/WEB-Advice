const tcb = require("@cloudbase/node-sdk");

const cloud = tcb.init({
  env: "",
});
const db = cloud.database();
const _ = db.command;
exports.main = async (event, context) => {
  let res = {};
  const auth = cloud.auth().getUserInfo();
  return auth.uid;
};