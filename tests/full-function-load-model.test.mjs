// 스크립트 이름: CommentBible 10k·50k 부하 예산 모델
// 버전: 1.0.0
// 작성일: 2026-08-14
// 변경사항: 결정론 동시 사용자 latency·connection 계산
// 용도: 무네트워크 용량 회귀 테스트
// 사용자 입력 필요: 없음
import test from 'node:test'; import assert from 'node:assert/strict';
const percentile=(values,p)=>values[Math.min(values.length-1,Math.ceil(values.length*p)-1)];
function model(concurrency){const requests=[];const add=(count,base,slope,kind)=>{for(let i=0;i<count;i++)requests.push({kind,ms:base+((i*17)%23)+concurrency*slope});};add(Math.round(concurrency*.70),18,.002,'cdn');add(Math.round(concurrency*.20),42,.018,'read');add(Math.round(concurrency*.05),80,.025,'auth');add(Math.round(concurrency*.04),95,.030,'write');add(Math.round(concurrency*.01),110,.035,'moderation');const byKind=kind=>requests.filter(row=>row.kind===kind).map(row=>row.ms).sort((a,b)=>a-b);const dynamicRps=concurrency*(.20/10+.05/60+.04/30+.01/60);return{concurrency,staticRps:concurrency*.70/20,dynamicRps,connections:Math.ceil(dynamicRps/12),readP95:percentile(byKind('read'),.95),writeP95:percentile(byKind('write'),.95),authP95:percentile(byKind('auth'),.95),queueIngressRps:concurrency*.05/30};}
test('10k 동시 사용자 예산은 candidate SLO 안',()=>{const result=model(10_000);assert.ok(result.readP95<=500);assert.ok(result.writeP95<=800);assert.ok(result.authP95<=1_000);assert.ok(result.connections<=60);console.log(JSON.stringify(result));});
test('50k는 단일 DB 연결 예산을 넘으므로 수평 확장 게이트',()=>{const result=model(50_000);assert.ok(result.connections>60);assert.ok(result.readP95>500||result.writeP95>800);console.log(JSON.stringify(result));});
// 스크립트 끝 — CommentBible 10k·50k 부하 예산 모델 1.0.0
