import React, { useEffect, useState } from 'react'
import axios from 'axios';
export default function Dashboard() {
  const [totalInvestment,setTotalInvestment] = useState(null);
  useEffect(()=>{
    async function getTotalInvestment(){
      try{
        let response = await axios.get('http://localhost:5000/api/user/totalInvestments')
        setTotalInvestment(response.data);
        console.log(response);
        console.log(response.data);
      }catch(err){
        console.log(err);
      }
    }
    getTotalInvestment();
  })
  return (
    <div>
      <div className='width-full primary-flex padding-main justify-center transform-down'>
        <div className='width-half search-bar padding-main primary-flex'>
          <div className='primary-grid float-50 justify-start font-roboto'>
            <span className='text-enlarge'>Total Corpus Value</span>
            <span className='stock-buy-head'>{totalInvestment}</span>
          </div>
          <div className='primary-grid float-50 justify-end font-roboto'>
            <span className='text-enlarge'>Current Investment Value</span>
            <span className='primary-flex justify-end stock-buy-head'>{totalInvestment}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
