export function formatDate(date){
    const d = new Date(date);
    let day = d.getDate();
    const month = d.getMonth()+1;
    const year = d.getFullYear();    
    return `${year}-${month}-${day < 10 ? 0:""}${day}`;
}