export default function Forbidden() {
  return (
    <div className="container text-center py-5">
      <h1 className="display-4 text-danger">403</h1>
      <p className="lead">Bạn không có quyền truy cập vào trang này.</p>
      <a href="/" className="btn btn-primary mt-3">Quay về trang chủ</a>
    </div>
  );
}
