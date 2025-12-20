import { useEffect } from "react";
import api from "../config/axios";
import { useNavigate } from "react-router-dom";

export default function GoogleLoginButton() {
  const navigate = useNavigate();

  useEffect(() => {
    /* global google */
    google.accounts.id.initialize({
      client_id: "771070671322-oj66upovh6en1n52hlv9j4bhb80r02hi.apps.googleusercontent.com",
      callback: handleCredentialResponse,
    });

    google.accounts.id.renderButton(
      document.getElementById("googleBtn"),
      {
        theme: "outline",
        size: "large",
        width: "100%",
      }
    );
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      const credential = response.credential; // ✅ JWT ID TOKEN (GIS)

      const res = await api.post("/Auth/google-login", {
        credential,
      });

      const data = res.data;

      // lưu token backend
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      // lưu user
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.userId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          roleName: data.roleName,
          photo: data.profileImageUrl,
        })
      );

      window.dispatchEvent(new Event("app-auth-changed"));
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Google login thất bại");
    }
  };

  return <div id="googleBtn"></div>;
}
