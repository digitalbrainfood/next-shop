import { jsPDF } from 'jspdf';

export function downloadCredentialPdf({ schoolName, role, username, password, loginUrl }) {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });

    doc.setFontSize(22);
    doc.text(schoolName || 'My School', 60, 90);

    doc.setFontSize(13);
    doc.setTextColor(120);
    doc.text(`${role} Vendor account`, 60, 115);

    doc.setDrawColor(220);
    doc.line(60, 135, 552, 135);

    doc.setTextColor(40);
    doc.setFontSize(11);
    doc.text('Your sign-in details', 60, 175);

    doc.setFont('courier', 'normal');
    doc.setFontSize(13);
    doc.text(`Username:  ${username}`, 60, 205);
    doc.text(`Password:  ${password}`, 60, 230);
    if (loginUrl) doc.text(`URL:       ${loginUrl}`, 60, 255);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("What's next:", 60, 305);
    doc.text('1. Open the URL above in your browser.', 60, 325);
    doc.text('2. Sign in with your username and password.', 60, 343);
    doc.text(`3. You'll see your ${role.toLowerCase()} dashboard ready to use.`, 60, 361);

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Keep this document private. ${schoolName} - ${new Date().toLocaleDateString()}`, 60, 760);

    const safeName = String(username).replace(/[^a-z0-9-_]/gi, '_');
    doc.save(`${safeName}-credentials.pdf`);
}
