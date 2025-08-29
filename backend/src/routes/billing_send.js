
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { generateInvoicePDF } = require('../services/billingService');
const whatsapp = require('../services/whatsappProvider');
const fs = require('fs');
const path = require('path');

// POST /api/billing/send/:branchId?caption=Opcional
router.post('/send/:branchId', auth(['super_admin','admin']), async (req,res)=>{
  try{
    const branchId = req.params.branchId;
    const ordersFile = path.join(__dirname,'../../data/orders.json');
    const branchesFile = path.join(__dirname,'../../data/branches.json');
    const orders = fs.existsSync(ordersFile) ? JSON.parse(fs.readFileSync(ordersFile)).filter(o=> (o.branch_id||'')==branchId) : [];
    const branches = fs.existsSync(branchesFile) ? JSON.parse(fs.readFileSync(branchesFile)) : [];
    const branch = branches.find(b=> (b.id||'')==branchId);
    if(!branch) return res.status(404).json({error:'Sucursal no encontrada'});
    const out = path.join(__dirname,'../../uploads',`invoice_${branchId}_${Date.now()}.pdf`);
    await generateInvoicePDF({branch, orders, outputPath: out, branding:{logo:process.env.BILLING_LOGO || null, footer:process.env.BILLING_FOOTER || ''}});
    // send via whatsapp provider using sendMedia if available
    const caption = req.query.caption || `Factura - ${branch.name}`;
    try{
      if(typeof whatsapp.sendMedia === 'function'){
        await whatsapp.sendMedia(branch.order_number || branch.system_number || process.env.DEFAULT_BRANCH_NUMBER, out, caption);
      }else{
        // fallback: send message with file path or public URL
        await whatsapp.sendMessage(branch.order_number || branch.system_number || process.env.DEFAULT_BRANCH_NUMBER, `Factura generada: ${out}`);
      }
    }catch(e){
      // Don't fail the operation if sending fails; return PDF path for manual sending.
      return res.status(500).json({error:'Factura generada pero fallo al enviar por WhatsApp', detail: e.message, pdf: out});
    }
    return res.json({ok:true, pdf: out});
  }catch(e){ return res.status(500).json({error:e.message}) }
});

module.exports = router;
