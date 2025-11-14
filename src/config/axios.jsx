import axios from "axios";
// const baseUrl = "http://localhost:8080/api";
const baseURL = "https://smartgym-dwdxddbrf8f0e4dy.southeastasia-01.azurewebsites.net/api";
const config = {
  baseURL,
  timeout: 3000000,
};
const api = axios.create(config);
api.defaults.baseURL = baseURL;

const handleBefore = (config) => {
  const token = localStorage.getItem("token")?.replaceAll('"', "");
  config.headers["Authorization"] = `Bearer ${token}`;
  return config;
};

const handleError = (error) => {
  // console.log(error);
  return;
};

api.interceptors.request.use(handleBefore, handleError);
// api.interceptors.response.use(null, handleError);

export default api;