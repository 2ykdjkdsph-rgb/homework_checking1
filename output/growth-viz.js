(function(){
  const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,char=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    "\"":"&quot;",
    "'":"&#39;"
  }[char]));

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

  function hexToRgba(hex,alpha){
    const clean=String(hex||"#2f7d5c").replace("#","").trim();
    const full=clean.length===3?clean.split("").map(char=>char+char).join(""):clean.padEnd(6,"0").slice(0,6);
    const int=parseInt(full,16);
    const r=(int>>16)&255,g=(int>>8)&255,b=int&255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function splitLabel(label,maxChars){
    const source=String(label||"").trim();
    if(!source) return [""];
    const lines=[];
    for(let index=0;index<source.length;index+=maxChars) lines.push(source.slice(index,index+maxChars));
    return lines.slice(0,3);
  }

  function buildAxisLabel(label,x,y,maxChars,color,anchor){
    const lines=splitLabel(label,maxChars);
    return `<text x="${x}" y="${y}" fill="${color}" font-size="12" font-weight="700" text-anchor="${anchor}" dominant-baseline="middle">${lines.map((line,index)=>`<tspan x="${x}" dy="${index===0?0:14}">${escapeHtml(line)}</tspan>`).join("")}</text>`;
  }

  function getRadarPoints(values,cx,cy,radius){
    const total=values.length;
    return values.map((value,index)=>{
      const angle=-Math.PI/2+(Math.PI*2*index/total);
      const ratio=clamp(Number(value)||0,0,100)/100;
      const x=cx+Math.cos(angle)*radius*ratio;
      const y=cy+Math.sin(angle)*radius*ratio;
      return {x,y};
    });
  }

  function pointsToString(points){
    return points.map(point=>`${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  }

  function bindSelection(container,selector,onSelect){
    container.querySelectorAll(selector).forEach(node=>{
      node.addEventListener("click",event=>{
        event.stopPropagation();
        const index=Number(node.dataset.index);
        if(Number.isFinite(index)) onSelect(index);
      });
    });
  }

  function renderRadar(container,{history,selectedIndex,colors,onSelect}){
    if(!container) return;
    if(!Array.isArray(history)||!history.length){
      container.innerHTML="";
      return;
    }
    const dims=history[0].dimensions||[];
    const width=Math.max(360,container.clientWidth||720);
    const height=Math.max(280,container.clientHeight||400);
    const cx=width/2;
    const cy=height*0.56;
    const radius=Math.min(width*0.25,height*0.34);
    const gridRings=5;
    const axisColor="rgba(24,35,42,0.12)";
    const gridColor="rgba(24,35,42,0.08)";
    const labelColor="#607074";
    const selectedBase=colors?.[0]||"#2f7d5c";
    const gridPolygons=Array.from({length:gridRings},(_,ringIndex)=>{
      const ratio=(ringIndex+1)/gridRings;
      const points=dims.map((_,dimIndex)=>{
        const angle=-Math.PI/2+(Math.PI*2*dimIndex/dims.length);
        return {
          x:cx+Math.cos(angle)*radius*ratio,
          y:cy+Math.sin(angle)*radius*ratio
        };
      });
      return `<polygon points="${pointsToString(points)}" fill="${ringIndex%2===0?'rgba(255,255,255,0.22)':'rgba(255,255,255,0.08)'}" stroke="${gridColor}" stroke-width="1"/>`;
    }).join("");
    const axes=dims.map((dim,index)=>{
      const angle=-Math.PI/2+(Math.PI*2*index/dims.length);
      const axisX=cx+Math.cos(angle)*radius;
      const axisY=cy+Math.sin(angle)*radius;
      const labelX=cx+Math.cos(angle)*(radius+28);
      const labelY=cy+Math.sin(angle)*(radius+26);
      const anchor=Math.abs(Math.cos(angle))<0.25?"middle":Math.cos(angle)>0?"start":"end";
      return `<line x1="${cx}" y1="${cy}" x2="${axisX}" y2="${axisY}" stroke="${axisColor}" stroke-width="1"/>${buildAxisLabel(dim.label,labelX,labelY,4,labelColor,anchor)}`;
    }).join("");
    const orderedIndexes=history.map((_,index)=>index).filter(index=>index!==selectedIndex);
    if(selectedIndex>=0) orderedIndexes.push(selectedIndex);
    const polygons=orderedIndexes.map(index=>{
      const entry=history[index];
      const points=getRadarPoints(entry.dimensions.map(item=>item.value),cx,cy,radius);
      const opacityBase=index===selectedIndex?0.92:Math.min(0.18+((index+1)/history.length)*0.18,0.48);
      const fillOpacity=index===selectedIndex?0.18:Math.min(0.04+((index+1)/history.length)*0.05,0.12);
      const strokeWidth=index===selectedIndex?2.8:1.35;
      const vertices=index===selectedIndex?points.map(point=>`<circle cx="${point.x}" cy="${point.y}" r="4.5" fill="#ffffff" stroke="${selectedBase}" stroke-width="2"/>`).join(""):"";
      return `<g class="radar-series" data-index="${index}"><polygon points="${pointsToString(points)}" fill="${hexToRgba(selectedBase,fillOpacity)}" stroke="${hexToRgba(selectedBase,opacityBase)}" stroke-width="${strokeWidth}" stroke-linejoin="round"/><polygon class="radar-hit" data-index="${index}" points="${pointsToString(points)}" fill="transparent" stroke="transparent" stroke-width="22" stroke-linejoin="round"/>${vertices}</g>`;
    }).join("");
    container.innerHTML=`<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="成长雷达图">${gridPolygons}${axes}${polygons}</svg>`;
    bindSelection(container,".radar-hit,.radar-series",onSelect);
  }

  function renderStacked(container,{history,selectedIndex,colors,onSelect,showAxisNumbers}){
    if(!container) return;
    if(!Array.isArray(history)||!history.length){
      container.innerHTML="";
      return;
    }
    const dims=history[0].dimensions||[];
    const width=Math.max(360,container.clientWidth||720);
    const height=Math.max(280,container.clientHeight||400);
    const margin=showAxisNumbers?{top:22,right:20,bottom:98,left:46}:{top:18,right:18,bottom:92,left:24};
    const plotWidth=width-margin.left-margin.right;
    const plotHeight=height-margin.top-margin.bottom;
    const totals=history.map(entry=>entry.dimensions.reduce((sum,item)=>sum+(Number(item.value)||0),0));
    const maxTotal=Math.max(...totals,280);
    const cappedMax=Math.ceil(maxTotal/20)*20;
    const count=Math.max(history.length,1);
    const step=plotWidth/count;
    const barWidth=clamp(step*0.48,28,56);
    const gridLines=5;
    const backgroundBandColor="rgba(12,106,120,0.06)";
    const svgParts=[];
    for(let index=0;index<=gridLines;index+=1){
      const y=margin.top+(plotHeight/gridLines)*index;
      svgParts.push(`<line x1="${margin.left}" y1="${y}" x2="${width-margin.right}" y2="${y}" stroke="rgba(24,35,42,0.08)" stroke-width="1"/>`);
      if(showAxisNumbers){
        const value=Math.round(cappedMax-(cappedMax/gridLines)*index);
        svgParts.push(`<text x="${margin.left-8}" y="${y}" text-anchor="end" dominant-baseline="middle" fill="#607074" font-size="10" font-weight="700">${value}</text>`);
      }
    }
    svgParts.push(`<line x1="${margin.left}" y1="${height-margin.bottom}" x2="${width-margin.right}" y2="${height-margin.bottom}" stroke="rgba(24,35,42,0.14)" stroke-width="1.2"/>`);
    history.forEach((entry,index)=>{
      const xCenter=margin.left+step*index+step/2;
      const x=xCenter-barWidth/2;
      const isSelected=index===selectedIndex;
      const totalHeight=(totals[index]/cappedMax)*plotHeight;
      if(isSelected){
        svgParts.push(`<rect x="${xCenter-step*0.42}" y="${margin.top-6}" width="${step*0.84}" height="${plotHeight+18}" rx="16" fill="${backgroundBandColor}" stroke="rgba(12,106,120,0.12)" stroke-width="1"/>`);
      }
      let cursorY=height-margin.bottom;
      entry.dimensions.forEach((dim,dimIndex)=>{
        const value=Number(dim.value)||0;
        const segmentHeight=Math.max(2,(value/cappedMax)*plotHeight);
        const y=cursorY-segmentHeight;
        const isTop=dimIndex===entry.dimensions.length-1;
        const radius=isTop?10:0;
        svgParts.push(`<rect x="${x}" y="${y}" width="${barWidth}" height="${segmentHeight}" rx="${radius}" fill="${hexToRgba(colors?.[dimIndex]||"#2f7d5c",isSelected?0.94:0.72)}" stroke="${isSelected?'rgba(255,255,255,0.68)':'transparent'}" stroke-width="${isSelected?1:0}"/>`);
        cursorY=y;
      });
      if(isSelected){
        svgParts.push(`<rect x="${x-2}" y="${height-margin.bottom-totalHeight-2}" width="${barWidth+4}" height="${totalHeight+4}" rx="12" fill="transparent" stroke="rgba(12,106,120,0.28)" stroke-width="1.2"/>`);
        if(showAxisNumbers){
          svgParts.push(`<text x="${xCenter}" y="${height-margin.bottom-totalHeight-12}" text-anchor="middle" fill="#1e2b2f" font-size="11" font-weight="800">${totals[index]}</text>`);
        }
      }
      const labelLines=splitLabel(entry.assignmentName,6);
      svgParts.push(`<text x="${xCenter}" y="${height-margin.bottom+24}" text-anchor="middle" fill="${isSelected?'#1e2b2f':'#607074'}" font-size="11" font-weight="${isSelected?800:700}" dominant-baseline="hanging">${labelLines.map((line,lineIndex)=>`<tspan x="${xCenter}" dy="${lineIndex===0?0:14}">${escapeHtml(line)}</tspan>`).join("")}</text>`);
      svgParts.push(`<rect class="bar-hit" data-index="${index}" x="${xCenter-step*0.46}" y="${margin.top-8}" width="${step*0.92}" height="${plotHeight+72}" rx="18" fill="transparent"/>`);
    });
    container.innerHTML=`<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="成长堆叠柱状图">${svgParts.join("")}</svg>`;
    bindSelection(container,".bar-hit",onSelect);
  }

  window.GrowthViz={renderRadar,renderStacked};
})();
