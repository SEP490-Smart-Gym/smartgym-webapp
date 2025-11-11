import { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import api from "../../config/axios"; // your axios config
import { Table, Button, Space, Tag, Modal, Input, DatePicker, Select } from "antd";
import dayjs from "dayjs";

export default function AdminVoucher() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);

  // form add
  const [newV, setNewV] = useState({
    code: "",
    description: "",
    discountType: "Amount", // Percentage or Amount
    discountValue: 0,
    usageLimit: 0,
    validFrom: "",
    validUntil: "",
  });

  // modal update
  const [editing, setEditing] = useState(null);

  // ========================= LOAD DATA =========================
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/discountcode");
      setVouchers(res.data || []);
    } catch (err) {
      alert("Không thể tải danh sách voucher");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ========================= ADD =========================
  const handleAdd = async () => {
    if (!newV.code || !newV.validFrom || !newV.validUntil)
      return alert("Vui lòng nhập đầy đủ thông tin voucher!");

    try {
      await api.post("/discountcode", newV);
      loadData();
      setNewV({
        code: "",
        description: "",
        discountType: "Amount",
        discountValue: 0,
        usageLimit: 0,
        validFrom: "",
        validUntil: "",
      });
      alert("Thêm voucher thành công!");
    } catch (err) {
      alert("Thêm không thành công!");
    }
  };

  // ========================= DELETE =========================
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá voucher này?")) return;
    try {
      await api.delete(`/discountcode/${id}`);
      loadData();
    } catch {
      alert("Không thể xoá!");
    }
  };

  // ========================= UPDATE =========================
  const saveUpdate = async () => {
    try {
      await api.put(`/discountcode/${editing.id}`, editing);
      setEditing(null);
      loadData();
    } catch {
      alert("Cập nhật thất bại");
    }
  };

  // ========================= TABLE =========================
  const columns = [
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Giá trị",
      dataIndex: "discountValue",
      key: "discountValue",
      render: (v, r) =>
        r.discountType === "Amount"
          ? v.toLocaleString() + " đ"
          : v + "%",
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "validFrom",
      render: (d) => dayjs(d).format("DD/MM/YYYY"),
    },
    {
      title: "Ngày kết thúc",
      dataIndex: "validUntil",
      render: (d) => dayjs(d).format("DD/MM/YYYY"),
    },
    {
      title: "Số lượng",
      dataIndex: "usageLimit",
    },
    {
      title: "Còn lại",
      dataIndex: "remainingUsage",
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      render: (v) => <Tag color={v ? "green" : "red"}>{v ? "Active" : "Inactive"}</Tag>,
    },
    {
      title: "Thao tác",
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => setEditing(row)}>
            Sửa
          </Button>
          <Button size="small" danger onClick={() => handleDelete(row.id)}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="container-fluid py-5">
      <div className="row g-4">
        <div className="col-lg-3">
          <AdminSidebar />
        </div>

        <div className="col-lg-9">
          <h2 className="mb-4 text-center">Quản lý Voucher</h2>

          {/* FORM ADD */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Thêm voucher mới</h5>

              <div className="row g-3">
                <div className="col-md-4">
                  <label>Mã voucher</label>
                  <Input
                    value={newV.code}
                    onChange={(e) => setNewV({ ...newV, code: e.target.value })}
                  />
                </div>

                <div className="col-md-4">
                  <label>Giảm giá</label>
                  <Input
                    type="number"
                    value={newV.discountValue}
                    onChange={(e) =>
                      setNewV({ ...newV, discountValue: +e.target.value })
                    }
                  />
                </div>

                <div className="col-md-4">
                  <label>Loại giảm</label>
                  <Select
                    value={newV.discountType}
                    style={{ width: "100%" }}
                    onChange={(v) => setNewV({ ...newV, discountType: v })}
                  >
                    <Select.Option value="Amount">Theo số tiền</Select.Option>
                    <Select.Option value="Percentage">Theo %</Select.Option>
                  </Select>
                </div>

                <div className="col-md-6">
                  <label>Ngày bắt đầu</label>
                  <DatePicker
                    style={{ width: "100%" }}
                    value={newV.validFrom ? dayjs(newV.validFrom) : null}
                    onChange={(d) => setNewV({ ...newV, validFrom: d })}
                  />
                </div>

                <div className="col-md-6">
                  <label>Ngày kết thúc</label>
                  <DatePicker
                    style={{ width: "100%" }}
                    value={newV.validUntil ? dayjs(newV.validUntil) : null}
                    onChange={(d) => setNewV({ ...newV, validUntil: d })}
                  />
                </div>

                <div className="col-md-4">
                  <label>Số lượng</label>
                  <Input
                    type="number"
                    value={newV.usageLimit}
                    onChange={(e) =>
                      setNewV({ ...newV, usageLimit: +e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="mt-3 text-end">
                <Button type="primary" onClick={handleAdd}>
                  Thêm voucher
                </Button>
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5>Danh sách voucher</h5>

              <Table
                loading={loading}
                columns={columns}
                dataSource={vouchers}
                rowKey="id"
                scroll={{ x: "max-content" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL EDIT */}
      <Modal
        open={!!editing}
        title="Chỉnh sửa voucher"
        onCancel={() => setEditing(null)}
        onOk={saveUpdate}
      >
        {editing && (
          <div className="row g-3">
            <div>
              <label>Mã voucher</label>
              <Input
                value={editing.code}
                onChange={(e) => setEditing({ ...editing, code: e.target.value })}
              />
            </div>
            <div>
              <label>Mô tả</label>
              <Input
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </div>
            <div>
              <label>Giảm giá</label>
              <Input
                type="number"
                value={editing.discountValue}
                onChange={(e) =>
                  setEditing({ ...editing, discountValue: +e.target.value })
                }
              />
            </div>
            <div>
              <label>Ngày bắt đầu</label>
              <DatePicker
                style={{ width: "100%" }}
                value={dayjs(editing.validFrom)}
                onChange={(d) => setEditing({ ...editing, validFrom: d })}
              />
            </div>
            <div>
              <label>Ngày kết thúc</label>
              <DatePicker
                style={{ width: "100%" }}
                value={dayjs(editing.validUntil)}
                onChange={(d) => setEditing({ ...editing, validUntil: d })}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
