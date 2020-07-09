const tcb = require("@cloudbase/node-sdk");

const cloud = tcb.init({
  env: "",
});
const db = cloud.database();
const _ = db.command;
exports.main = async (event, context) => {
  let res = {};
  const auth = cloud.auth().getUserInfo();
  const uid = auth.uid;
  res.list = (await db.collection('advice').where({
    _openid:uid
  }).get()).data;
  res.code = 0;
  return res;
};