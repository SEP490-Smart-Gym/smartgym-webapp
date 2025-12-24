import axios from "axios";

const baseURL =
  "https://smart-gym-api-gzbaefdadydng3fp.eastasia-01.azurewebsites.net/api";

const api = axios.create({
  baseURL,
  timeout: 3000000,
});

// ============================= //
//  REQUEST INTERCEPTOR (ADD TOKEN)
// ============================= //
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")?.replaceAll('"', "");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// ============================= //
//    REFRESH TOKEN LOGIC
// ============================= //
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

// ============================= //
//   RESPONSE INTERCEPTOR
// ============================= //
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Không refresh cho /Auth/login hoặc /Auth/refresh
    if (
      originalRequest.url.includes("/Auth/login") ||
      originalRequest.url.includes("/Auth/refresh")
    ) {
      return Promise.reject(err);
    }

    // Nếu 401 (token hết hạn)
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken")?.replaceAll('"', "");

      if (!refreshToken) {
        logoutUser();
        return Promise.reject(err);
      }

      // Nếu đang refresh → chờ
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers["Authorization"] = "Bearer " + newToken;
            return api(originalRequest);
          })
          .catch((e) => Promise.reject(e));
      }

      // Bắt đầu refresh
      isRefreshing = true;

      try {
        const res = await axios.post(baseURL + "/Auth/refresh", {
          refreshToken,
        });

        const newToken = res.data?.accessToken;
        const newRefresh = res.data?.refreshToken;

        if (!newToken) throw new Error("Refresh token failed");

        // Lưu token mới
        localStorage.setItem("token", newToken);
        if (newRefresh) localStorage.setItem("refreshToken", newRefresh);

        api.defaults.headers["Authorization"] = "Bearer " + newToken;

        processQueue(null, newToken);
        isRefreshing = false;

        // Gửi lại request trước đó
        originalRequest.headers["Authorization"] = "Bearer " + newToken;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        logoutUser();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

// ============================= //
//        LOGOUT HELPER
// ============================= //
function logoutUser() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");

  window.dispatchEvent(new Event("app-auth-changed")); // render lại UI
  window.location.href = "/login";
}

export default api;
