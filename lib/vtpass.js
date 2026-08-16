import axios from "axios";

const vtpass = axios.create({
  baseURL: process.env.VTPASS_BASE_URL,
  auth: {
    username: process.env.VTPASS_EMAIL,
    password: process.env.VTPASS_PASSWORD,
  },
  headers: { "Content-Type": "application/json" },
});

export const AIRTIME_SERVICE_IDS = {
  mtn: "mtn",
  glo: "glo",
  airtel: "airtel",
  "9mobile": "etisalat",
};

export const DATA_SERVICE_IDS = {
  mtn: "mtn-data",
  glo: "glo-data",
  airtel: "airtel-data",
  "9mobile": "etisalat-data",
};

export async function getDataPlans(network) {
  const serviceID = DATA_SERVICE_IDS[network];
  const res = await vtpass.get(`/service-variations?serviceID=${serviceID}`);
  return res.data.content.variations;
}

export async function purchaseAirtime({ requestId, phone, network, amountNaira }) {
  const res = await vtpass.post("/pay", {
    request_id: requestId,
    serviceID: AIRTIME_SERVICE_IDS[network],
    amount: amountNaira,
    phone,
  });
  return res.data;
}

export async function purchaseData({ requestId, phone, network, variationCode }) {
  const res = await vtpass.post("/pay", {
    request_id: requestId,
    serviceID: DATA_SERVICE_IDS[network],
    billersCode: phone,
    variation_code: variationCode,
    phone,
  });
  return res.data;
}

export default vtpass;
