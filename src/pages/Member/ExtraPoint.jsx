import React, { useState, useMemo } from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// mock dữ liệu lịch sử điểm thưởng
// type = "earn" (nhận) hoặc "redeem" (tiêu)
const pointHistory = [
  { id: 1, type: "earn", points: 100, date: "2023-05-01", note: "Check-in tại gym" },
  { id: 2, type: "redeem", points: 50, date: "2023-05-02", note: "Đổi voucher giảm giá" },
  { id: 3, type: "earn", points: 200, date: "2023-05-03", note: "Hoàn thành buổi PT" },
  { id: 4, type: "earn", points: 150, date: "2023-05-04", note: "Tham gia thử thách tuần" },
  { id: 5, type: "redeem", points: 100, date: "2023-05-05", note: "Đổi quà nước uống" },
  { id: 6, type: "earn", points: 80, date: "2023-05-06", note: "Đánh giá dịch vụ" },
  { id: 7, type: "earn", points: 120, date: "2023-05-07", note: "Check-in tại gym" },
  { id: 8, type: "redeem", points: 60, date: "2023-05-08", note: "Đổi voucher giảm giá" },
  { id: 9, type: "earn", points: 90, date: "2023-05-09", note: "Tham gia lớp GroupX" },
  { id: 10, type: "earn", points: 110, date: "2023-05-10", note: "Hoàn thành thử thách bước chân" },
  { id: 11, type: "redeem", points: 40, date: "2023-05-11", note: "Đổi khăn tập" },
  { id: 12, type: "earn", points: 70, date: "2023-05-12", note: "Check-in tại gym" },
];

const ExtraPoint = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all"); // all | earn | redeem
  // sortOrder không cần nữa nhưng giữ lại cũng không sao
  const [sortOrder, setSortOrder] = useState("desc"); // mặc định desc = mới → cũ

  const itemsPerPage = 5;

  // tổng điểm hiện tại
  const totalPoints = useMemo(
    () =>
      pointHistory.reduce(
        (sum, t) => sum + (t.type === "earn" ? t.points : -t.points),
        0
      ),
    []
  );

  // lọc + sắp xếp dữ liệu (ngày mới luôn lên đầu)
  const filtered = useMemo(() => {
    let list = pointHistory;

    if (filter === "earn") {
      list = list.filter((t) => t.type === "earn");
    } else if (filter === "redeem") {
      list = list.filter((t) => t.type === "redeem");
    }

    // sort theo date, mặc định mới → cũ
    const sorted = [...list].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return timeB - timeA; // luôn: mới → cũ
    });

    return sorted;
  }, [filter]); // không cần sortOrder nữa nếu luôn mới → cũ

  const pageCount = Math.ceil(filtered.length / itemsPerPage);
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
        className="relative rounded-3xl shadow-2xl p-8 w-full max-w-3xl overflow-hidden"
        style={{
          backgroundImage:
            "url('https://setupphonggym.vn/wp-content/uploads/2020/12/mo-hinh-kinh-doanh-phong-gym-300m2.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Lớp phủ xanh đen */}
        <div className="absolute inset-0 bg-[#0b1220]/80 pointer-events-none" />

        {/* Nội dung */}
        <div className="relative z-10">
          {/* Header + tổng điểm */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Lịch Sử Điểm Thưởng
            </h1>
            <p className="text-sm text-white mb-3">
              Theo dõi điểm bạn đã tích lũy và đã sử dụng trong hệ thống
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-white">
              Tổng điểm hiện tại: {totalPoints.toLocaleString()} điểm
            </p>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 text-center">
              Chi tiết giao dịch điểm
            </h2>

            {/* Bộ lọc loại điểm */}
            <div className="mb-6 flex flex-wrap justify-center text-center gap-4">
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
                key={`${filter}-${sortOrder}-${currentPage}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentTransactions.length === 0 ? (
                  <p className="text-center text-white py-8">
                    Chưa có lịch sử điểm phù hợp với bộ lọc
                  </p>
                ) : (
                  <ul className="list-none mx-auto max-w-[85%] space-y-3">
                    {currentTransactions.map((item) => {
                      const isEarn = item.type === "earn";

                      return (
                        <div
                          key={item.id}
                          className="backdrop-blur-sm px-4 py-3 rounded-2xl shadow-md"
                        >
                          {/* 3 cột trên cùng một hàng: note - ngày - điểm */}
                          <div className="flex items-center gap-3 w-full">
                            {/* NOTE - căn trái, chiếm nhiều nhất, cắt nếu dài */}
                            <div className="flex-1 min-w-0 text-left text-sm md:text-base text-white truncate">
                              {item.note || "—"}
                            </div>

                            {/* NGÀY - cột giữa, cố định, không xuống dòng */}
                            <div className="w-28 text-center text-xs md:text-sm text-white whitespace-nowrap">
                              {item.date}
                            </div>

                            {/* ĐIỂM - cột phải, in đậm, xanh/đỏ, không xuống dòng */}
                            <div className="w-32 text-right whitespace-nowrap">
                              <span
                                className="font-extrabold"
                                style={{
                                  color: isEarn ? "#16a34a" : "#dc2626",
                                }}
                              >
                                {isEarn ? "+" : "-"}
                                {item.points.toLocaleString()} điểm
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </ul>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Phân trang */}
            <div className="mt-6 flex justify-center space-x-2">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    currentPage === page
                      ? "bg-red-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  aria-label={`Trang ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtraPoint;
