export default function getOrderDate(){
    const d = new Date();
    const date = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear();
    return `${year}-${month+1}-${date}`;
}