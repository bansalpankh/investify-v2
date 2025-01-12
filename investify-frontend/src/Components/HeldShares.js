import React, { useEffect, useState } from 'react'
import axios from 'axios';
export default function HeldShares() {
  const [investments, setInvestments] = useState([]);
  useEffect(()=>{
    async function getAllInvestments(){
      try{
        let response = await axios.get('http://localhost:5000/api/user/allInvestments');
        setInvestments(response.data);
      }catch(err){
        console.log(err);
      }
    }
    getAllInvestments();
  },[])
  return (
    <div>
      <div className='width-full primary-grid padding-main'>
        {investments.length > 0?(
          investments.map((items)=>(
            <div className='width-half search-bar'>
              <div className='primary-grid'>
                  <span>{items.shareName}</span>
                  <span>{items.totalValue}</span>
                  <span>{items.avgPrice}</span>
              </div>
            </div>
          ))
        ):(
          <div></div>
        )}
      </div>
    </div>
  )
}
