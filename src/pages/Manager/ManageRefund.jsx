// src/views/RefundManagement.jsx
import React, { useState } from "react";
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

// ================= MOCK DATA =================
const mockRefundRequests = [
  {
    id: 1,
    memberName: "Nguyễn Văn A",
    memberEmail: "nguyenvana@example.com",
    memberPhone: "0901 234 567",

    refundAmount: 500000,
    reason: "Không sắp xếp được thời gian tập",
    status: "Pending", // Pending | Approved | Rejected
    requestDate: "2025-12-01T09:30:00Z",

    packageName: "Gói Gym 3 tháng",
    packageDuration: "3 tháng",
    packageSessions: 36,
    packagePrice: 1500000,
    startDate: "2025-11-01",
    paymentMethod: "Stripe - Visa •••• 4242",

    rejectNote: "",
  },
  {
    id: 2,
    memberName: "Trần Thị B",
    memberEmail: "tranthib@example.com",
    memberPhone: "0908 765 432",

    refundAmount: 300000,
    reason: "Lý do cá nhân (chuyển chỗ ở)",
    status: "Pending",
    requestDate: "2025-12-02T10:45:00Z",

    packageName: "Gói Yoga 1 tháng",
    packageDuration: "1 tháng",
    packageSessions: 12,
    packagePrice: 600000,
    startDate: "2025-11-20",
    paymentMethod: "Tiền mặt tại quầy",

    rejectNote: "",
  },
  {
    id: 3,
    memberName: "Lê Văn C",
    memberEmail: "levanc@example.com",
    memberPhone: "0912 888 999",

    refundAmount: 800000,
    reason: "Không hài lòng về dịch vụ",
    status: "Approved",
    requestDate: "2025-11-28T14:15:00Z",

    packageName: "Gói PT 10 buổi",
    packageDuration: "2 tháng",
    packageSessions: 10,
    packagePrice: 2000000,
    startDate: "2025-10-15",
    paymentMethod: "Stripe - MasterCard •••• 1234",

    rejectNote: "",
  },
];
// ================= END MOCK DATA =================

const formatVNDC = (amount) => {
  if (amount == null) return "—";
  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
};

const formatVNDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN");
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
    default:
      return "warning"; // Pending
  }
};

const RefundManagement = () => {
  const [refunds, setRefunds] = useState(mockRefundRequests);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Tab lọc: ALL | Pending | Approved | Rejected
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Ghi chú khi từ chối
  const [rejectNote, setRejectNote] = useState("");

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const toggleDetail = () => setDetailOpen((prev) => !prev);

  const openDetail = (refund) => {
    setSelectedRefund(refund);
    setRejectNote(refund.rejectNote || "");
    setDetailOpen(true);
  };

  const updateRefundStatus = (id, newStatus, note) => {
    setRefunds((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: newStatus,
              rejectNote:
                newStatus === "Rejected" ? note || r.rejectNote : r.rejectNote,
            }
          : r
      )
    );

    setSelectedRefund((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            status: newStatus,
            rejectNote:
              newStatus === "Rejected" ? note || prev.rejectNote : prev.rejectNote,
          }
        : prev
    );
  };

  const handleApprove = () => {
    if (!selectedRefund) return;
    updateRefundStatus(selectedRefund.id, "Approved", rejectNote);
    setDetailOpen(false);
  };

  const handleReject = () => {
    if (!selectedRefund) return;
    updateRefundStatus(selectedRefund.id, "Rejected", rejectNote);
    setDetailOpen(false);
  };

  // Lọc theo tab
  const filteredRefunds = refunds.filter((r) => {
    if (statusFilter === "ALL") return true;
    return r.status === statusFilter;
  });

  // Sắp xếp: ALL -> Pending trước, sau đó theo ngày
  const sortedRefunds = [...filteredRefunds].sort((a, b) => {
    if (statusFilter === "ALL") {
      const order = { Pending: 0, Approved: 1, Rejected: 2 };
      const diffStatus = order[a.status] - order[b.status];
      if (diffStatus !== 0) return diffStatus;
    }
    return new Date(b.requestDate) - new Date(a.requestDate);
  });

  // Phân trang: tối đa 10 đơn / trang
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

  // Khi đổi tab filter, reset về trang 1
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
              <h3 className="mb-0" style={{ fontWeight: "bold" }}>
                Quản lý yêu cầu hoàn tiền
              </h3>
            </CardHeader>

            <CardBody>
              <p className="text-muted mb-3 text-center">
                Danh sách các yêu cầu hoàn tiền từ khách hàng. Bạn có thể xem chi tiết từng yêu cầu
                và lựa chọn <strong>Chấp nhận</strong> hoặc <strong>Từ chối</strong>.
              </p>

              {/* Tabs lọc trạng thái - căn giữa */}
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
              </div>

              <div className="table-responsive">
                <Table className="align-items-center table-flush" hover>
                  <thead className="thead-light">
                    <tr>
                      <th>#</th>
                      <th>Khách hàng</th>
                      <th>Số tiền hoàn</th>
                      <th>Lý do hoàn</th>
                      <th>Ngày yêu cầu</th>
                      <th>Trạng thái</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRefunds.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">
                          Không có yêu cầu hoàn tiền nào.
                        </td>
                      </tr>
                    ) : (
                      pageRefunds.map((r, index) => (
                        <tr key={r.id}>
                          <td>{startIndex + index + 1}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{r.memberName}</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>
                              {r.memberEmail}
                            </div>
                          </td>
                          <td>{formatVNDC(r.refundAmount)}</td>
                          <td style={{ maxWidth: 260 }}>
                            <span className="text-wrap">{r.reason}</span>
                          </td>
                          <td>{formatVNDateTime(r.requestDate)}</td>
                          <td>
                            <Badge color={statusColor(r.status)}>{r.status}</Badge>
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
                    Trang {safePage}
                  </div>
                  <Pagination aria-label="Refund pagination" className="mb-0">
                    <PaginationItem disabled={safePage === 1}>
                      <PaginationLink
                        previous
                        onClick={() => goToPage(safePage - 1)}
                      />
                    </PaginationItem>
                    <PaginationItem disabled={safePage === totalPages}>
                      <PaginationLink next onClick={() => goToPage(safePage + 1)} />
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
              <h5 className="mb-3">Thông tin khách hàng</h5>
              <Row>
                <Col md="6">
                  <p className="mb-1">
                    <strong>Họ tên:</strong> {selectedRefund.memberName}
                  </p>
                  <p className="mb-1">
                    <strong>Email:</strong> {selectedRefund.memberEmail}
                  </p>
                  <p className="mb-1">
                    <strong>Số điện thoại:</strong> {selectedRefund.memberPhone}
                  </p>
                </Col>
                <Col md="6">
                  <p className="mb-1">
                    <strong>Ngày yêu cầu:</strong>{" "}
                    {formatVNDateTime(selectedRefund.requestDate)}
                  </p>
                  <p className="mb-1">
                    <strong>Trạng thái:</strong>{" "}
                    <Badge color={statusColor(selectedRefund.status)}>
                      {selectedRefund.status}
                    </Badge>
                  </p>
                </Col>
              </Row>

              <hr />

              {/* Thông tin gói tập */}
              <h5 className="mb-3">Thông tin gói tập</h5>
              <Row>
                <Col md="6">
                  <p className="mb-1">
                    <strong>Tên gói:</strong> {selectedRefund.packageName}
                  </p>
                  <p className="mb-1">
                    <strong>Thời gian:</strong>{" "}
                    {selectedRefund.packageDuration}
                  </p>
                  <p className="mb-1">
                    <strong>Số buổi:</strong>{" "}
                    {selectedRefund.packageSessions} buổi
                  </p>
                </Col>
                <Col md="6">
                  <p className="mb-1">
                    <strong>Giá gói:</strong>{" "}
                    {formatVNDC(selectedRefund.packagePrice)}
                  </p>
                  <p className="mb-1">
                    <strong>Ngày bắt đầu:</strong>{" "}
                    {formatVNDate(selectedRefund.startDate)}
                  </p>
                  <p className="mb-1">
                    <strong>Phương thức thanh toán:</strong>{" "}
                    {selectedRefund.paymentMethod}
                  </p>
                </Col>
              </Row>

              <hr />

              {/* Thông tin hoàn tiền */}
              <h5 className="mb-3">Thông tin hoàn tiền</h5>
              <p className="mb-1">
                <strong>Số tiền đề nghị hoàn:</strong>{" "}
                {formatVNDC(selectedRefund.refundAmount)}
              </p>
              <p className="mb-1">
                <strong>Lý do hoàn:</strong> {selectedRefund.reason}
              </p>

              {/* Nếu đã bị từ chối và có ghi chú -> hiển thị */}
              {selectedRefund.status === "Rejected" &&
                selectedRefund.rejectNote && (
                  <p className="mb-1">
                    <strong>Ghi chú khi từ chối:</strong>{" "}
                    {selectedRefund.rejectNote}
                  </p>
                )}

              {/* Khi đang Pending -> cho nhập note từ chối */}
              {selectedRefund.status === "Pending" && (
                <div className="mt-3">
                  <Label for="reject-note">
                    Ghi chú
                  </Label>
                  <Input
                    id="reject-note"
                    type="textarea"
                    rows="3"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                  />
                </div>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
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
