import User from "../../models/User.js";

export default class AuthDataLayer {
  public async getUserByEmail(email: string) {
    const user = await User.findOne({ email });
    return user;
  }
}
