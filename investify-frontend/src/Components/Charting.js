import React, { useState } from 'react'
import axios from "axios";
import { useParams } from 'react-router-dom';
import {Line} from 'react-chartjs-2'
import {Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler} from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

export default function Charting() {
  const {shareName} = useParams();
  const [buy, setBuy] = useState(true);
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const handleBuySubmit = async (e) => {
    e.preventDefault();
    try{
      if (qty==='' && price===''){
        console.log("Enter Price and Quantity");
        return
      }
      await axios.post(`/invest/equity/${shareName}/buy`,{qty:qty,price:price});
    }catch(err){
      console.log(err);
    }
  }
  const handleSellSubmit = async (e) => {
    e.preventDefault();
    try{
      await axios.post(`/invest/equity/${shareName}/sell`,{qty:qty,price:price});
    }catch(err){
      console.log(err);
    }
  }
  function toggleBuy(){
    if (buy){
      setBuy(false);
    } else{
      setBuy(true);
    }
  }
    const data = {
        labels: ['','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','',''],
        datasets: [
          {
            label: '',
            data: [101.25, 101.18,101.50, 102.26, 102.15, 102.03, 102.82, 103.20, 102.97, 103.24,
              103.01, 102.78, 102.90, 101.94, 101.08, 100.80, 100.29, 100.45, 99.99, 99.29,
              100.02, 99.91, 99.94, 99.25, 99.25, 99.25, 99.25, 99.55, 99.25, 99.55,
              99.55, 99.25, 99.55, 99.25, 99.25, 99.55, 99.55, 99.55, 99.55, 99.55,
              99.25, 99.25, 99.25, 99.25, 99.25, 99.25, 99.25, 99.25, 99.25, 99.25,
              99.25, 99.25, 99.25, 99.25, 99.25, 99.25, 99.25, 99.25, 99.25, 99.25,
              99.25, 99.25, 99.25, 99.25, 99.25, 99.25, 99.25, 99.25, 99.25, 99.25,
              99.25, 99.25, 99.25, 99.25, 99.25, 109.25, 99.25, 99.25, 99.55, 99.25,
              99.55, 99.55, 99.55, 99.25, 99.55, 99.25, 99.25, 99.25, 99.25, 99.25,
              99.25, 99.25, 99.25, 99.25, 99.25, 99.25, 99.25, 99.25, 89.25, 102.62],
            fill: false,
            borderColor: 'rgba(0, 176, 80, 1)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
          },
        ],
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
        scales: {
          x: {
            display: false,
            grid: {
              display: false,
            },
          },
          y: {
            display: false,
            grid: {
              display: false,
            },
          },
        },
    };
  return (
    <div className='primary-flex mar-main-extra'>
        <div className='float-10'></div>
        <div className='primary-flex flex-col float-55'>
            <img src='//assets-netstorage.groww.in/web-assets/billion_groww_desktop/prod/_next/static/media/O.5307e6f8.svg' alt='' className='logo-img-stk back-white-round'></img>
            <div className='primary-flex flex-col'>
                <span className='font-roboto whiten text-enlarge mar-bottom'>{`${shareName}`}</span>
                <div className='primary-flex align-center'>
                    <span className='font-roboto whiten text-enlarge mar-right'>{`₹102.62`}</span>
                    <span className='font-roboto active'>+3.00 (3.01%)</span>
                </div>
                <div style={{ height: '200px', width: '100%' }} className='mar-top'>
                    <Line data={data} options={options} />
                </div>
            </div>
        </div>
        <div className='float-35 primary-flex flex-col align-center'>
          <div className='sell-buy-box primary-flex flex-col'>
            <div className='price-box'>
              <div className='font-roboto whiten primary-flex flex-col mar-left'>
                <span>Ola Electric Mobility</span>
                <span className='font-small'>{`ISE - ${102.62}`}</span>
              </div>
            </div>
            <div className='primary-flex border-bottom'>
              <button className={`padding-sml mar-top-sml ${buy ? 'make-active' : ''}`} id='buy' onClick={toggleBuy}>BUY</button>
              <button className={`padding-sml mar-top-sml ${!buy ? 'make-active' : ''}`} id="sell" onClick={toggleBuy}>SELL</button>
            </div>
            <div>
              <form className='primary-grid'>
                <div className='primary-flex font-roboto padding-sml transform-down'>
                  <span className='whiten float-50 transform-down'>Quantity</span>
                  <div className='float-50 primary-flex justify-end mar-right'>
                    <input type='text' className='inpt' name='qty' value={qty} onChange={(e)=>setQty(e.target.value)}></input>
                  </div>
                </div>
                <div className='primary-flex font-roboto padding-sml'>
                  <span className='whiten float-50'>Price</span>
                  <div className='float-50 primary-flex justify-end mar-right'>
                    <input type='text' className='inpt' placeholder='At Market' name='price' value={price} onChange={(e)=>setPrice(e.target.value)}></input>
                  </div>
                </div>
                <div className='height-main'></div>
                {
                  buy?(
                    <button type='submit' className='order-placer' onClick={handleBuySubmit}>BUY</button>
                  ):(
                    <button type='button' className='order-placer-sell' onClick={handleSellSubmit}>SELL</button>
                  )
                }
              </form>
            </div>
          </div>
        </div>
    </div>
  )
}
