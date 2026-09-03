function login() {
    alert("تم تشغيل الكود");
}
function saveProduct() {

    let name = prompt("اكتب اسم المنتج");
    let price = prompt("اكتب سعر المنتج");

    if (name && price) {
        alert("تم حفظ المنتج: " + name + " بسعر " + price);
    } else {
        alert("يرجى كتابة بيانات المنتج");
    }

}