import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../config/axios";

// ================= Helpers =================
function toISODateSafe(s) {
  if (!s) return null;

  // backend trả dạng "2025-12-12T15:23:03.3526593" (không có Z / offset)
  // JS Date có thể hiểu sai (coi như local) => giờ không +7
  // => ép coi là UTC bằng cách thêm 'Z' nếu thiếu timezone
  let str = String(s).trim();

  // cắt nano -> milli cho chắc (Date parse ổn nhất với tối đa 3 chữ số ms)
  // "....3526593" -> "....352"
  str = str.replace(
    /(\.\d{3})\d+(?=(Z|[+-]\d{2}:\d{2})?$)/,
    "$1"
  );

  const hasTZ = /Z$|[+-]\d{2}:\d{2}$/.test(str);
  return hasTZ ? str : `${str}Z`;
}

function formatDateTimeVN(dateStr) {
  const iso = toISODateSafe(dateStr);
  if (!iso) return "";
  const d = new Date(iso);

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function normalizeTx(raw) {
  const points = Number(raw?.points ?? 0);
  return {
    id: raw?.transactionId ?? raw?.id,
    type:
      points >= 0 ||
      String(raw?.transactionType || "").toLowerCase() === "earned"
        ? "earn"
        : "redeem",
    points: Math.abs(points), // UI dùng +/- theo type, nên để trị tuyệt đối
    signedPoints: points, // nếu bạn muốn dùng trực tiếp
    date: raw?.transactionDate,
    note: raw?.description || "—",
  };
}

const ExtraPoint = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all"); // all | earn | redeem
  const [sortOrder, setSortOrder] = useState("desc"); // desc: mới → cũ, asc: cũ → mới

  const itemsPerPage = 10;

  // ===== API state =====
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [txError, setTxError] = useState("");

  // Load transactions
  useEffect(() => {
    let cancelled = false;

    const fetchTransactions = async () => {
      setLoadingTx(true);
      setTxError("");
      try {
        const res = await api.get("/Loyalty/transactions");
        const arr = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.items)
          ? res.data.items
          : [];

        const mapped = arr
          .map(normalizeTx)
          .filter((x) => x.id != null);

        if (!cancelled) setTransactions(mapped);
      } catch (err) {
        console.error("GET /Loyalty/transactions error:", err?.response?.data || err);
        if (!cancelled) setTxError("Không tải được lịch sử điểm.");
      } finally {
        if (!cancelled) setLoadingTx(false);
      }
    };

    fetchTransactions();
    return () => {
      cancelled = true;
    };
  }, []);

  // tổng điểm hiện tại (từ transactions)
  const totalPoints = useMemo(() => {
    return transactions.reduce((sum, t) => {
      // nếu type earn => +points, redeem => -points
      return sum + (t.type === "earn" ? t.points : -t.points);
    }, 0);
  }, [transactions]);

  // lọc + sắp xếp dữ liệu
  const filtered = useMemo(() => {
    let list = transactions;

    if (filter === "earn") list = list.filter((t) => t.type === "earn");
    if (filter === "redeem") list = list.filter((t) => t.type === "redeem");

    const sorted = [...list].sort((a, b) => {
      const timeA = new Date(toISODateSafe(a.date) || 0).getTime();
      const timeB = new Date(toISODateSafe(b.date) || 0).getTime();
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });

    return sorted;
  }, [transactions, filter, sortOrder]);

  const pageCount = Math.ceil(filtered.length / itemsPerPage) || 1;
  const offset = (currentPage - 1) * itemsPerPage;
  const currentTransactions = filtered.slice(offset, offset + itemsPerPage);

  const handleChangeFilter = (value) => {
    setFilter(value);
    setCurrentPage(1);
  };

  const handleChangeSort = (value) => {
    setSortOrder(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-yellow-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url('https://enhome.vn/wp-content/uploads/2023/11/thiet-ke-phong-gym-10.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "rgba(2, 0, 68, 0.75)",
          backgroundBlendMode: "multiply",
          zIndex: 1,
        }}
      >
        <div className="relative z-10" style={{ paddingTop: "40px", paddingBottom: "40px" }}>
          {/* Header + tổng điểm */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Lịch Sử Điểm Thưởng
            </h1>
            <p className="text-sm text-white mb-3">
              Theo dõi điểm bạn đã tích lũy và đã sử dụng trong hệ thống
            </p>
            <b
              className="text-2xl md:text-3xl font-extrabold"
              style={{ color: "#fcb0b0ff", fontSize: "20px" }}
            >
              Tổng điểm hiện tại: {totalPoints.toLocaleString()} điểm
            </b>
          </div>

          <div>
            <h2
              className="text-xl md:text-2xl font-bold text-white mb-4 text-center"
              style={{ marginTop: "20px" }}
            >
              Chi tiết giao dịch điểm
            </h2>

            {/* Bộ lọc */}
            <div className="mb-4 flex flex-wrap justify-center text-center gap-4">
              <button
                type="button"
                onClick={() => handleChangeFilter("all")}
                className={`px-5 py-2 rounded-full text-sm font-medium border ${
                  filter === "all"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white bg-opacity-60 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                Tất cả
              </button>

              <button
                type="button"
                onClick={() => handleChangeFilter("earn")}
                style={{ margin: "10px" }}
                className={`px-5 py-2 rounded-full text-sm font-medium border flex items-center gap-2 ${
                  filter === "earn"
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white bg-opacity-60 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                Cộng điểm
              </button>

              <button
                type="button"
                onClick={() => handleChangeFilter("redeem")}
                className={`px-5 py-2 rounded-full text-sm font-medium border flex items-center gap-2 ${
                  filter === "redeem"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white bg-opacity-60 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                Trừ điểm
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${filter}-${sortOrder}-${currentPage}-${loadingTx}-${txError}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {loadingTx ? (
                  <p className="text-center text-white py-8">Đang tải lịch sử điểm...</p>
                ) : txError ? (
                  <p className="text-center text-white py-8">{txError}</p>
                ) : currentTransactions.length === 0 ? (
                  <p className="text-center text-white py-8">
                    Chưa có lịch sử điểm phù hợp với bộ lọc
                  </p>
                ) : (
                  <div className="mt-2 rounded-2xl overflow-hidden backdrop-blur-sm bg-white/5">
                    <div style={{ margin: "0 50px" }}>
                      <table
                        className="w-full"
                        style={{
                          marginLeft: "auto",
                          marginRight: "auto",
                          width: "100%",
                          maxWidth: "900px",
                          borderCollapse: "collapse",
                        }}
                      >
                        <thead>
                          <tr className="text-sm">
                            <th
                              style={{
                                color: "#ff8383ff",
                                textAlign: "center",
                                fontSize: "24px",
                              }}
                              className="py-2 pl-4 pr-2 text-left w-[50%]"
                            >
                              <b>Nội dung</b>
                            </th>
                            <th
                              style={{
                                color: "#ff8383ff",
                                textAlign: "center",
                                fontSize: "24px",
                              }}
                              className="py-2 px-2 text-center w-[25%]"
                            >
                              <b>Ngày giờ</b>
                            </th>
                            <th
                              style={{
                                color: "#ff8383ff",
                                textAlign: "center",
                                fontSize: "24px",
                              }}
                              className="py-2 px-2 text-right w-[25%]"
                            >
                              <b>Điểm</b>
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {currentTransactions.map((item) => {
                            const isEarn = item.type === "earn";
                            return (
                              <tr
                                key={item.id}
                                className="text-white bg-white/10 border-t border-white/10"
                              >
                                <td className="py-3 pl-4 pr-2 truncate">
                                  {item.note}
                                </td>

                                <td className="py-3 px-2 text-center whitespace-nowrap">
                                  {formatDateTimeVN(item.date)}
                                </td>

                                <td
                                  className="py-3 pr-4 pl-2 text-center font-black whitespace-nowrap"
                                  style={{
                                    color: isEarn ? "#22c55e" : "#ef4444",
                                  }}
                                >
                                  <b>
                                    {isEarn ? "+" : "-"}
                                    {item.points.toLocaleString()} điểm
                                  </b>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Phân trang */}
            {!loadingTx && !txError && filtered.length > 0 && (
              <div className="mb-6 flex flex-wrap justify-center text-center gap-4">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{ marginBottom: 10, marginLeft: 10 }}
                    className={`px-2 py-1 rounded-md text-sm font-medium ${
                      currentPage === page
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-white bg-opacity-60 text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                    aria-label={`Trang ${page}`}
                    aria-current={currentPage === page ? "page" : undefined}
                  >
                    Trang {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtraPoint;
