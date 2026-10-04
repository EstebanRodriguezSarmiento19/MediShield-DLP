import pool,{transaction} from '../../db/pool.js';
import {analyzeTransfer,validateTransfer} from './dlp.service.js';
import {loadContext,saveAnalysis,getDlpStats,getRecentAnalyses} from './dlp.store.js';
import {pageLimit} from '../../shared/validation.js';
export async function analyze(req,res) {
  const clean=validateTransfer(req.body);
  const result=await transaction(async cx=>{
    const context=await loadContext(cx,req.user.id,clean.recipient);
    const result=analyzeTransfer(clean,context);
    await saveAnalysis(cx,result,req.user,req.ip);
    return result;
  });
  res.status(201).json({success:true,data:result});
}
export async function stats(req,res) {res.json({success:true,data:await getDlpStats(req.user)});}
export async function recent(req,res) {res.json({success:true,data:await getRecentAnalyses(req.user,pageLimit(req.query.limit))});}
export async function rules(req,res) {
  const [rows]=await pool.execute('SELECT * FROM regla_dlp ORDER BY id');
  res.json({success:true,data:rows});
}
