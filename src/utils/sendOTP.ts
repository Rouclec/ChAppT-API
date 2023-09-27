import { Twilio } from "twilio";
const sendOTP = (phoneNumber: string) => {
  const accountSID = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verificationCode = Math.floor(
    Math.random() * 899999 + 100000
  ).toString();

  const client = new Twilio(accountSID, authToken);

  client.messages.create({
    from: "+12565489772",
    to: "+237650184172",
    body: `Your verification code is ${verificationCode}`,
  });
  return verificationCode;
};

export default sendOTP;
