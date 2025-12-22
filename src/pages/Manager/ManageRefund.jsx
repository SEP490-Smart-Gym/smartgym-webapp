// src/views/RefundManagement.jsx
import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Container,
  Row,
  Col,
  Table,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
  Input,
  Pagination,
  PaginationItem,
  PaginationLink,
} from "reactstrap";
import { message } from "antd";
import api from "../../config/axios"; // chỉnh lại path nếu khác

const formatVNDC = (amount) => {
  if (amount == null) return "—";
  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
};

const formatVNDateTime = (isoLike) => {
  if (!isoLike) return "—";
  let s = String(isoLike).trim();

  // cắt nano -> milli (Date parse ổn nhất với <= 3 chữ số ms)
  s = s.replace(/(\.\d{3})\d+/, "$1");

  // nếu không có timezone (Z hoặc ±HH:MM) => thêm 'Z' để coi là UTC
  const hasTZ = /([zZ]|[+\-]\d{2}:?\d{2})$/.test(s);
  if (!hasTZ) s += "Z";

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
};

const formatVNDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
};

const statusColor = (status) => {
  switch (status) {
    case "Approved":
      return "success";
    case "Rejected":
      return "danger";
    case "Cancelled":
      return "secondary";
    default:
      return "warning"; // Pending
  }
};

const statusLabelVi = (status) => {
  switch (status) {
    case "Pending":
      return "Chờ xác nhận";
    case "Approved":
      return "Chấp nhận";
    case "Rejected":
      return "Từ chối";
    case "Cancelled":
      return "Đã hủy đơn";
    default:
      return status || "Không rõ";
  }
};

const RefundManagement = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedRefund, setSelectedRefund] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Tab lọc: ALL | Pending | Approved | Rejected | Cancelled
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Ghi chú admin (adminNotes)
  const [adminNotes, setAdminNotes] = useState("");

  // Payment detail (theo paymentId)
  const [paymentDetail, setPaymentDetail] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [stripeRefundLoading, setStripeRefundLoading] = useState(false);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const toggleDetail = () => setDetailOpen((prev) => !prev);

  // ====== API: lấy danh sách refund-requests ======
  const fetchRefundRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/MemberPackage/refund-requests");
      const data = Array.isArray(res.data) ? res.data : [];
      setRefunds(
        data.map((r) => ({
          id: r.id,
          memberPackageId: r.memberPackageId,
          memberId: r.memberId,
          paymentId: r.paymentId,
          requestedAmount: r.requestedAmount,
          reason: r.reason,
          status: r.status,
          requestedAt: r.requestedAt,
          reviewedAt: r.reviewedAt,
          adminNotes: r.adminNotes,
          memberName: r.memberName,
          packageName: r.packageName,
          reviewerName: r.reviewerName,
        }))
      );
    } catch (err) {
      console.error("Error fetching refund-requests:", err);
      message.error("Không tải được danh sách yêu cầu hoàn tiền.");
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  };

  // ====== API: lấy chi tiết 1 refund ======
  const fetchRefundDetail = async (id) => {
    if (!id) return null;
    try {
      const res = await api.get(`/MemberPackage/refund-requests/${id}`);
      const r = res.data;
      if (!r) return null;
      return {
        id: r.id,
        memberPackageId: r.memberPackageId,
        memberId: r.memberId,
        paymentId: r.paymentId,
        requestedAmount: r.requestedAmount,
        reason: r.reason,
        status: r.status,
        requestedAt: r.requestedAt,
        reviewedAt: r.reviewedAt,
        adminNotes: r.adminNotes,
        memberName: r.memberName,
        packageName: r.packageName,
        reviewerName: r.reviewerName,
      };
    } catch (err) {
      console.error("Error fetching refund detail:", err);
      message.error("Không xem được chi tiết yêu cầu hoàn tiền.");
      return null;
    }
  };

  // ====== API: lấy thông tin thanh toán theo paymentId ======
  const fetchPaymentDetail = async (paymentId) => {
    if (!paymentId) {
      setPaymentDetail(null);
      return null;
    }
    try {
      setPaymentLoading(true);
      const res = await api.get(`/Payment/${paymentId}`);
      const data = res.data;
      setPaymentDetail(data);
      return data;
    } catch (err) {
      console.error("Error fetching payment detail:", err);
      message.error("Không lấy được thông tin thanh toán cho đơn hoàn tiền.");
      setPaymentDetail(null);
      return null;
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    fetchRefundRequests();
  }, []);

  const openDetail = async (refund) => {
    // lấy chi tiết đơn hoàn tiền
    const full = await fetchRefundDetail(refund.id);
    const data = full || refund;
    setSelectedRefund(data);
    setAdminNotes(data.adminNotes || "");

    // lấy thêm thông tin thanh toán theo paymentId
    if (data.paymentId) {
      await fetchPaymentDetail(data.paymentId);
    } else {
      setPaymentDetail(null);
    }

    setDetailOpen(true);
  };

  // ====== API: cập nhật status (PUT) ======
  const updateRefundStatus = async (id, newStatus, notes) => {
    try {
      await api.put(`/MemberPackage/refund-requests/${id}/status`, {
        status: newStatus,
        adminNotes: notes ?? "",
      });

      await fetchRefundRequests();

      const full = await fetchRefundDetail(id);
      if (full) {
        setSelectedRefund(full);
        setAdminNotes(full.adminNotes || "");
      }

      message.success("Cập nhật trạng thái yêu cầu hoàn tiền thành công.");
    } catch (err) {
      console.error("Error updating refund status:", err);
      const msg =
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        err?.message ||
        "Cập nhật trạng thái thất bại.";
      message.error(msg);
    }
  };

  const handleApprove = async () => {
    if (!selectedRefund) return;
    await updateRefundStatus(selectedRefund.id, "Approved", adminNotes);
    setDetailOpen(false);
  };

  const handleReject = async () => {
    if (!selectedRefund) return;

    if (!adminNotes.trim()) {
      message.warning(
        "Vui lòng nhập ghi chú quản trị (adminNotes) khi từ chối yêu cầu."
      );
      return;
    }

    await updateRefundStatus(selectedRefund.id, "Rejected", adminNotes.trim());
    setDetailOpen(false);
  };

  // ====== Thực hiện hoàn tiền Stripe theo paymentId ======
  const handleStripeRefund = async () => {
    if (!selectedRefund || !selectedRefund.paymentId) {
      message.error("Không tìm thấy thanh toán để hoàn tiền.");
      return;
    }

    try {
      setStripeRefundLoading(true);

      // đảm bảo có paymentDetail mới nhất
      let payment = paymentDetail;
      if (!payment) {
        payment = await fetchPaymentDetail(selectedRefund.paymentId);
        if (!payment) {
          return;
        }
      }

      const intentId = payment.stripePaymentIntentId;
      if (!intentId) {
        message.warning(
          "Thanh toán này không có Stripe Payment Intent Id. Không thể hoàn tiền Stripe."
        );
        return;
      }

      await api.post(`/Payment/${selectedRefund.paymentId}/refund`, {
        stripePaymentIntentId: intentId,
      });

      message.success("Thực hiện hoàn tiền Stripe thành công.");

      // Sau khi hoàn tiền có thể load lại danh sách hoặc detail nếu BE có cập nhật gì thêm
      await fetchRefundRequests();
      const full = await fetchRefundDetail(selectedRefund.id);
      if (full) {
        setSelectedRefund(full);
      }
    } catch (err) {
      console.error("Error doing Stripe refund:", err);
      const msg =
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        err?.message ||
        "Hoàn tiền Stripe thất bại.";
      message.error(msg);
    } finally {
      setStripeRefundLoading(false);
    }
  };

  // Lọc theo tab
  const filteredRefunds = refunds.filter((r) => {
    if (statusFilter === "ALL") return true;
    return (r.status || "").toUpperCase() === statusFilter.toUpperCase();
  });

  // Sắp xếp
  const sortedRefunds = [...filteredRefunds].sort((a, b) => {
    const statusA = (a.status || "").toUpperCase();
    const statusB = (b.status || "").toUpperCase();

    if (statusFilter === "ALL") {
      const order = { PENDING: 0, APPROVED: 1, REJECTED: 2, CANCELLED: 3 };
      const diffStatus = (order[statusA] ?? 99) - (order[statusB] ?? 99);
      if (diffStatus !== 0) return diffStatus;
    }

    return new Date(b.requestedAt) - new Date(a.requestedAt);
  });

  // Phân trang
  const totalPages =
    sortedRefunds.length === 0
      ? 1
      : Math.ceil(sortedRefunds.length / pageSize);
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageRefunds = sortedRefunds.slice(startIndex, startIndex + pageSize);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleChangeFilter = (filter) => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  return (
    <Container className="mt-5 mb-5" fluid>
      <Row>
        <Col xl="12">
          <Card className="shadow">
            <CardHeader className="border-0 d-flex justify-content-between align-items-center">
              <h3 className="mb-0" style={{ fontWeight: "bold", color: "#7a0000ff" }}>
                Quản lý yêu cầu hoàn tiền
              </h3>
            </CardHeader>

            <CardBody>
              <p className="text-muted mb-3 text-center">
                Danh sách các yêu cầu hoàn tiền từ hội viên. Bạn có thể xem chi
                tiết từng yêu cầu và lựa chọn{" "}
                <strong>Chấp nhận</strong>, <strong>Từ chối</strong> hoặc{" "}
                <strong>thực hiện hoàn tiền Stripe</strong> khi đủ điều kiện.
              </p>

              {/* Tabs lọc trạng thái */}
              <div
                className="d-flex mb-3 justify-content-center"
                style={{ gap: "0.5rem", flexWrap: "wrap" }}
              >
                <Button
                  size="sm"
                  type="button"
                  color={statusFilter === "ALL" ? "primary" : "secondary"}
                  outline={statusFilter !== "ALL"}
                  onClick={() => handleChangeFilter("ALL")}
                >
                  Tất cả
                </Button>
                <Button
                  size="sm"
                  type="button"
                  color={statusFilter === "Pending" ? "primary" : "secondary"}
                  outline={statusFilter !== "Pending"}
                  onClick={() => handleChangeFilter("Pending")}
                >
                  Chờ xác nhận
                </Button>
                <Button
                  size="sm"
                  type="button"
                  color={statusFilter === "Approved" ? "primary" : "secondary"}
                  outline={statusFilter !== "Approved"}
                  onClick={() => handleChangeFilter("Approved")}
                >
                  Đã chấp nhận
                </Button>
                <Button
                  size="sm"
                  type="button"
                  color={statusFilter === "Rejected" ? "primary" : "secondary"}
                  outline={statusFilter !== "Rejected"}
                  onClick={() => handleChangeFilter("Rejected")}
                >
                  Đã từ chối
                </Button>
                <Button
                  size="sm"
                  type="button"
                  color={statusFilter === "Cancelled" ? "primary" : "secondary"}
                  outline={statusFilter !== "Cancelled"}
                  onClick={() => handleChangeFilter("Cancelled")}
                >
                  Đã hủy đơn
                </Button>
              </div>

              {loading && (
                <p className="text-center text-muted">
                  Đang tải danh sách yêu cầu hoàn tiền...
                </p>
              )}

              <div className="table-responsive">
                <Table className="align-items-center table-flush" hover>
                  <thead className="thead-light">
                    <tr>
                      <th>#</th>
                      <th>Hội viên</th>
                      <th>Gói tập</th>
                      <th>Số tiền yêu cầu hoàn</th>
                      <th>Lý do hoàn</th>
                      <th>Ngày yêu cầu</th>
                      <th>Trạng thái</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && pageRefunds.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center text-muted">
                          Không có yêu cầu hoàn tiền nào.
                        </td>
                      </tr>
                    ) : (
                      pageRefunds.map((r, index) => (
                        <tr key={r.id}>
                          <td>{startIndex + index + 1}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>
                              {r.memberName || "—"}
                            </div>
                            {r.memberId && (
                              <div
                                className="text-muted"
                                style={{ fontSize: 12 }}
                              >
                                Member #{r.memberId}
                              </div>
                            )}
                          </td>
                          <td>
                            <div>{r.packageName || "—"}</div>
                          </td>
                          <td>{formatVNDC(r.requestedAmount)}</td>
                          <td style={{ maxWidth: 260 }}>
                            <span className="text-wrap">{r.reason}</span>
                          </td>
                          <td>{formatVNDateTime(r.requestedAt)}</td>
                          <td>
                            <Badge color={statusColor(r.status)}>
                              {statusLabelVi(r.status)}
                            </Badge>
                          </td>
                          <td className="text-right">
                            <Button
                              size="sm"
                              color="primary"
                              onClick={() => openDetail(r)}
                            >
                              Chi tiết
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {sortedRefunds.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted" style={{ fontSize: "0.9rem" }}>
                    Trang {safePage} / {totalPages}
                  </div>
                  <Pagination aria-label="Refund pagination" className="mb-0">
                    <PaginationItem disabled={safePage === 1}>
                      <PaginationLink
                        previous
                        onClick={() => goToPage(safePage - 1)}
                      />
                    </PaginationItem>
                    <PaginationItem disabled={safePage === totalPages}>
                      <PaginationLink
                        next
                        onClick={() => goToPage(safePage + 1)}
                      />
                    </PaginationItem>
                  </Pagination>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Modal chi tiết hoàn tiền */}
      <Modal isOpen={detailOpen} toggle={toggleDetail} size="lg">
        <ModalHeader toggle={toggleDetail}>
          Chi tiết yêu cầu hoàn tiền
        </ModalHeader>
        <ModalBody>
          {!selectedRefund ? (
            <p>Không có dữ liệu.</p>
          ) : (
            <>
              {/* Thông tin khách hàng */}
              <h5 className="mb-3">Thông tin hội viên</h5>
              <Row>
                <Col md="6">
                  <p className="mb-1">
                    <strong>Họ tên:</strong>{" "}
                    {selectedRefund.memberName || "—"}
                  </p>
                  <p className="mb-1">
                    <strong>Mã hội viên:</strong>{" "}
                    {selectedRefund.memberId || "—"}
                  </p>
                </Col>
                <Col md="6">
                  <p className="mb-1">
                    <strong>Ngày yêu cầu:</strong>{" "}
                    {formatVNDateTime(selectedRefund.requestedAt)}
                  </p>
                  <p className="mb-1">
                    <strong>Trạng thái:</strong>{" "}
                    <Badge color={statusColor(selectedRefund.status)}>
                      {statusLabelVi(selectedRefund.status)}
                    </Badge>
                  </p>
                  {selectedRefund.reviewedAt && (
                    <p className="mb-1">
                      <strong>Ngày xử lý:</strong>{" "}
                      {formatVNDateTime(selectedRefund.reviewedAt)}
                    </p>
                  )}
                  {selectedRefund.reviewerName && (
                    <p className="mb-1">
                      <strong>Người xử lý:</strong>{" "}
                      {selectedRefund.reviewerName}
                    </p>
                  )}
                </Col>
              </Row>

              <hr />

              {/* Thông tin gói tập */}
              <h5 className="mb-3">Thông tin gói tập</h5>
              <Row>
                <Col md="12">
                  <p className="mb-1">
                    <strong>Tên gói:</strong>{" "}
                    {selectedRefund.packageName || "—"}
                  </p>
                  <p className="mb-1">
                    <strong>Mã gói (MemberPackageId):</strong>{" "}
                    {selectedRefund.memberPackageId || "—"}
                  </p>
                </Col>
              </Row>

              <hr />

              {/* Thông tin hoàn tiền */}
              <h5 className="mb-3">Thông tin hoàn tiền</h5>
              <p className="mb-1">
                <strong>Số tiền yêu cầu hoàn:</strong>{" "}
                {formatVNDC(selectedRefund.requestedAmount)}
              </p>
              <p className="mb-1">
                <strong>Lý do hoàn:</strong> {selectedRefund.reason || "—"}
              </p>

              {/* Thông tin thanh toán (từ Payment) */}
              <hr />
              <h5 className="mb-3">Thông tin thanh toán</h5>
              {paymentLoading ? (
                <p className="text-muted">Đang tải thông tin thanh toán...</p>
              ) : paymentDetail ? (
                <>
                  <p className="mb-1">
                    <strong>Payment ID:</strong>{" "}
                    {selectedRefund.paymentId || "—"}
                  </p>
                  {/* Ẩn Stripe Payment Intent Id khỏi UI */}
                  {paymentDetail.paymentMethodName && (
                    <p className="mb-1">
                      <strong>Phương thức thanh toán:</strong>{" "}
                      {paymentDetail.paymentMethodName}
                    </p>
                  )}
                  {typeof paymentDetail.finalAmount === "number" && (
                    <p className="mb-1">
                      <strong>Số tiền đã thanh toán:</strong>{" "}
                      {formatVNDC(paymentDetail.finalAmount)}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted">
                  Không có thông tin thanh toán cho yêu cầu này.
                </p>
              )}

              {/* Ghi chú admin (nếu đã có) */}
              {selectedRefund.status !== "Pending" &&
                selectedRefund.adminNotes && (
                  <div className="mt-3">
                    <Label className="mb-1">
                      Ghi chú từ quản trị viên (đã lưu)
                    </Label>
                    <div className="border rounded p-2 bg-light">
                      {selectedRefund.adminNotes}
                    </div>
                  </div>
                )}

              {/* Khi đang Pending -> cho nhập adminNotes để lưu kèm status mới */}
              {selectedRefund.status === "Pending" && (
                <div className="mt-3">
                  <Label htmlFor="admin-notes">
                    Ghi chú quản trị (tuỳ chọn, nhưng{" "}
                    <strong>bắt buộc khi từ chối</strong>)
                  </Label>
                  <Input
                    id="admin-notes"
                    type="textarea"
                    rows="3"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Ví dụ: Không đủ điều kiện hoàn tiền theo chính sách..."
                  />
                </div>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          {/* Thực hiện hoàn tiền Stripe khi đã Approved & có paymentId & có Stripe intent */}
          {selectedRefund &&
            selectedRefund.status === "Approved" &&
            selectedRefund.paymentId && (
              <Button
                color="info"
                onClick={handleStripeRefund}
                disabled={stripeRefundLoading || paymentLoading}
              >
                {stripeRefundLoading
                  ? "Đang hoàn tiền Stripe..."
                  : "Thực hiện hoàn tiền Stripe"}
              </Button>
            )}

          {selectedRefund && selectedRefund.status === "Pending" && (
            <>
              <Button color="success" onClick={handleApprove}>
                Chấp nhận hoàn tiền
              </Button>
              <Button color="danger" onClick={handleReject}>
                Từ chối hoàn tiền
              </Button>
            </>
          )}
          <Button color="secondary" onClick={toggleDetail}>
            Đóng
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default RefundManagement;
