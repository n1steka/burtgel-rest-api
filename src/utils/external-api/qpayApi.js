import axios from "axios";
import cache from "memory-cache";

class QpayApi {
  async getToken() {
    if (cache.get("qpayToken") == null) await this.generateToken();
    return cache.get("qpayToken");
  }

  async generateToken() {
    var data = {
      username: process.env.QPAY_USERNAME,
      password: process.env.QPAY_PASSWORD,
    };

    var config = {
      method: "post",
      url: process.env.QPAY_BASEURL + "/v2/auth/token",
      headers: {
        "Content-Type": "application/json",
      },
      auth: data,
    };
    const response = await axios(config);
    let ms = 23 * 60 * 60 * 1000;
    await cache.put("qpayToken", response.data.access_token, ms);
    return cache.get("qpayToken");
  }

  async create_invoice(data) {
    try {
      return await this.post(data, "/v2/invoice");
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }
  async check_invoice(data) {
    return await this.post(data, "/v2/payment/check");
  }

  async post(data, url) {
    console.log("QPay request data:", data);
    try {
      const token = await this.getToken(6);
      const config = {
        method: "post",
        url: process.env.QPAY_BASEURL + url,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: data,
      };

      const response = await axios(config);
      // console.log(`QPay API ${url} response status:`, response.status);

      if (!response.data) {
        throw new Error("No response data received from QPay API");
      }

      return response;
    } catch (error) {
      console.error("QPay API error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      throw new Error(
        `QPay API error: ${error.message}. Status: ${error.response?.status}`
      );
    }
  }
}

export default new QpayApi();
