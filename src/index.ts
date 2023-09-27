import { config } from "dotenv";
import app from "./app";

config({path: './config.env'})



const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});
