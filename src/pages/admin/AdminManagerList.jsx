import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { Table, Space, Button, Modal, Form, Input, DatePicker, Select, message, Spin } from "antd";
import api from "../../config/axios";
import dayjs from "dayjs";

const GENDER_OPTIONS = [
    { label: "Nam", value: "Male" },
    { label: "Nữ", value: "Female" },
    { label: "Khác", value: "Other" },
];

export default function AdminManagerList() {
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(false);

    // antd form for add and edit
    const [addForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const [editing, setEditing] = useState(null);
    const [editOpen, setEditOpen] = useState(false);

    const fetchManagers = async () => {
        setLoading(true);
        try {
            const res = await api.get("/Admin/users");
            const raw = Array.isArray(res.data) ? res.data : res.data.items || res.data.data || [];
            const list = raw.filter((u) => {
                if (!u) return false;
                if (u.roleId) return Number(u.roleId) === 2;
                if (u.roleName && typeof u.roleName === 'string') return u.roleName.toLowerCase() === 'manager';
                if (u.roles && Array.isArray(u.roles)) return u.roles.some(r => (r.name || '').toLowerCase() === 'manager' || Number(r.id) === 2);
                return false;
            }).map(u => ({
                id: u.userId || u.id || (u.user && u.user.id),
                firstName: u.firstName || '',
                lastName: u.lastName || '',
                name: `${u.firstName || ''}${u.firstName && u.lastName ? ' ' : ''}${u.lastName || ''}`.trim() || u.fullName || u.name || '',
                email: u.email,
                phoneNumber: u.phoneNumber || u.phone,
                gender: u.gender || 'Male',
                address: u.address || '',
                dateOfBirth: u.dateOfBirth || null,
                raw: u,
            }));

            setManagers(list);
        } catch (err) {
            console.error(err);
            message.error('Lấy danh sách manager thất bại');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManagers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const generatePassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    };

    // CREATE (roleId = 2)
    const handleAdd = async (values) => {
        const autoPassword = generatePassword();
        const body = {
            email: values.email,
            password: autoPassword,
            firstName: values.firstName || '',
            lastName: values.lastName || '',
            phoneNumber: values.phoneNumber || '',
            gender: values.gender || 'Male',
            address: values.address || '',
            dateOfBirth: values.dateOfBirth ? dayjs(values.dateOfBirth).toISOString() : new Date().toISOString(),
            roleId: 2,
        };

        try {
            const res = await api.post('/Admin/create-user', body);
            const created = res.data;
            setManagers(prev => [created, ...prev]);

            Modal.success({
                title: 'Tạo manager thành công',
                content: (
                    <div>
                        Mật khẩu đăng nhập:
                        <br />
                        <strong>{autoPassword}</strong>
                    </div>
                ),
                getContainer: () => document.body,
            });

            addForm.resetFields();
        } catch (err) {
            console.error(err);
            const detail = err?.response?.data?.message || err?.response?.data || err.message;
            message.error('Tạo manager thất bại: ' + (detail || ''));
        }
    };

    // DELETE
    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa manager này?')) return;
        try {
            await api.delete(`/Admin/user/${id}`);
            setManagers(prev => prev.filter(m => m.id !== id));
            message.success('Xóa thành công');
        } catch (err) {
            console.error(err);
            message.error('Xóa thất bại');
        }
    };

    // EDIT (open modal with form)
    const openEdit = (record) => {
        editForm.setFieldsValue({
            id: record.id,
            firstName: record.firstName,
            lastName: record.lastName,
            email: record.email,
            phoneNumber: record.phoneNumber,
            gender: record.gender || 'Male',
            address: record.address,
            dateOfBirth: record.dateOfBirth ? dayjs(record.dateOfBirth) : null,
            roleId: record.roleId ?? 2,
        });
        setEditing(record);
        setEditOpen(true);
    };

    const saveEdit = async (values) => {
        if (!editing) return;
        const id = editing.id;
        const body = {
            email: values.email,
            firstName: values.firstName,
            lastName: values.lastName,
            phoneNumber: values.phoneNumber,
            gender: values.gender,
            address: values.address || '',
            dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null,
            roleId: values.roleId ?? 2,
        };

        try {
            const res = await api.put(`/Admin/user/${id}`, body);
            const updated = res.data || { id, ...body };
            setManagers(prev => prev.map(m => (m.id === id ? updated : m)));
            message.success('Cập nhật manager thành công');
            setEditOpen(false);
            setEditing(null);
            editForm.resetFields();
        } catch (err) {
            console.error(err);
            const detail = err?.response?.data?.message || err?.response?.data || err.message;
            message.error('Cập nhật thất bại: ' + (detail || ''));
        }
    };

    const columns = [
        {
            title: 'Ảnh',
            dataIndex: 'photo',
            key: 'photo',
            width: 90,
            render: (src, record) => (
                <img
                    src={src || record.imageUrl || '/img/useravt.jpg'}
                    alt={record.name || 'avatar'}
                    style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }}
                    onError={(e) => (e.currentTarget.src = '/img/useravt.jpg')}
                />
            ),
        },
        {
            title: 'Họ và tên',
            dataIndex: 'name',
            key: 'name',
            width: 220,
            render: (_, r) => {
                const first = r.firstName || '';
                const last = r.lastName || '';
                return (first || last) ? `${first} ${last}`.trim() : (r.name || '—');
            },
        },
        {
            title: 'Giới tính',
            dataIndex: 'gender',
            key: 'gender',
            width: 120,
            render: (v) => (v === 'Male' || v === 'male' ? 'Nam' : v === 'Female' || v === 'female' ? 'Nữ' : 'Khác'),
        },
        {
            title: 'Ngày sinh',
            dataIndex: 'dateOfBirth',
            key: 'dateOfBirth',
            width: 140,
            render: (v) => (v ? dayjs(v).format('DD/MM/YYYY') : '—'),
        },
        {
            title: 'SĐT',
            dataIndex: 'phoneNumber',
            key: 'phoneNumber',
            width: 150,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: 240,
        },
        {
            title: 'Thao tác',
            key: 'actions',
            fixed: 'right',
            width: 180,
            render: (_, record) => (
                <Space>
                    <Button size="small" onClick={() => openEdit(record)}>Sửa</Button>
                    <Button size="small" danger onClick={() => handleDelete(record.id)}>Xóa</Button>
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
                    <h2 className="mb-4 text-center">Quản lý Manager</h2>

                    <div className="card shadow-sm mb-4">
                        <div className="card-body">
                            <h5 className="mb-3">Thêm Manager mới</h5>

                            <Form form={addForm} layout="vertical" onFinish={handleAdd} initialValues={{ gender: 'Male' }}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <Form.Item name="lastName" rules={[{ required: true, message: 'Nhập họ' }]}>
                                            <Input placeholder="Họ" />
                                        </Form.Item>
                                    </div>

                                    <div className="col-md-6">
                                        <Form.Item name="firstName" rules={[{ required: true, message: 'Nhập tên' }]}>
                                            <Input placeholder="Tên" />
                                        </Form.Item>
                                    </div>

                                    <div className="col-md-4">
                                        <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
                                            <Input placeholder="Email" />
                                        </Form.Item>
                                    </div>

                                    <div className="col-md-3">
                                        <Form.Item name="phoneNumber" rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
                                            <Input placeholder="Số điện thoại" />
                                        </Form.Item>
                                    </div>
                                    <div className="col-md-3">
                                        <Form.Item name="dateOfBirth">
                                            <DatePicker style={{ width: '100%' }} placeholder="Ngày sinh" />
                                        </Form.Item>
                                    </div>
                                    <div className="col-md-2">
                                        <Form.Item name="gender">
                                            <Select options={GENDER_OPTIONS} />
                                        </Form.Item>
                                    </div>
                                    <div className="col-md-12">
                                        <Form.Item name="address">
                                            <Input placeholder="Địa chỉ" />
                                        </Form.Item>
                                    </div>

                                    <div className="col-md-4 d-flex align-items-end">
                                        <Form.Item style={{ width: '100%', marginBottom: 0 }}>
                                            <Button type="btn btn-add" htmlType="submit" block>
                                                Thêm manager
                                            </Button>
                                        </Form.Item>
                                    </div>
                                </div>
                            </Form>
                        </div>
                    </div>

                    <div className="card shadow-sm">
                        <div className="card-body">
                            <h5 className="mb-3">Danh sách Manager</h5>
                            {loading ? (
                                <div className="text-center py-5"><Spin /></div>
                            ) : (
                                <Table rowKey={(r) => r.id} columns={columns} dataSource={managers} pagination={{ pageSize: 8 }} scroll={{ x: 'max-content' }} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                title="Cập nhật Manager"
                open={editOpen}
                onCancel={() => { setEditOpen(false); setEditing(null); editForm.resetFields(); }}
                onOk={() => editForm.submit()}
                okText="Lưu thay đổi"
                cancelText="Hủy"
                destroyOnClose
            >
                <Form form={editForm} layout="vertical" onFinish={saveEdit}>
                    <Form.Item name="firstName" label="Tên" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>

                    <Form.Item name="lastName" label="Họ" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>

                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input />
                    </Form.Item>

                    <Form.Item name="phoneNumber" label="SĐT">
                        <Input />
                    </Form.Item>

                    <Form.Item name="gender" label="Giới tính">
                        <Select options={GENDER_OPTIONS} />
                    </Form.Item>

                    <Form.Item name="dateOfBirth" label="Ngày sinh">
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="address" label="Địa chỉ">
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
