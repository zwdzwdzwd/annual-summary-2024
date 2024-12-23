import { createCanvas, loadImage } from '@napi-rs/canvas';
import QRCode from 'qrcode';

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const url = body.url;

    // Create QR code
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 1
    });

    // Create canvas
    const canvas = createCanvas(300, 400);
    const ctx = canvas.getContext('2d');

    // Set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 300, 400);

    // Draw title
    ctx.fillStyle = '#000000';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('我的2024年终总结', 150, 40);

    // Draw decorative line
    ctx.beginPath();
    ctx.moveTo(50, 60);
    ctx.lineTo(250, 60);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw year
    ctx.font = '40px Arial';
    ctx.fillText('2024', 150, 120);

    // Draw QR code
    const qrCodeImage = await loadImage(qrCodeDataUrl);
    const qrCodeX = (300 - 200) / 2;
    const qrCodeY = (400 - 200) / 2;
    ctx.drawImage(qrCodeImage, qrCodeX, qrCodeY, 200, 200);

    // Draw hint text
    ctx.font = '10px Arial';
    ctx.fillText('扫描二维码查看完整总结', 150, 380);

    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');
    const base64Image = buffer.toString('base64');

    return new Response(JSON.stringify({
      status: 'success',
      image: base64Image
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
