import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
// import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

export default function Charting() {
  const { shareName } = useParams();
  const [Marketvalue, setMarketValue] = useState(124.25);
  const [buy, setBuy] = useState(true);
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  // handleBuySubmit
  // handleSellSubmit

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    newSocket.on('connect', () => {
      console.log('Connected to server');
      if (shareName) {
        newSocket.emit('joinSharedRoom', shareName);
        console.log(`Joining room: ${shareName}`);
      }
      newSocket.on('updateMarketValue',(currentValue)=>{
        setMarketValue(currentValue);
      })
    });
    return () => {
      newSocket.disconnect();
    };
  }, [shareName]);

  const handleBuySubmit = (e) => {
    e.preventDefault();
    if (socket && shareName && price && qty) {
      socket.emit('buyOrder', { shareName, price, qty });
      console.log('Buy order submitted:', { shareName, price, qty });
    } else {
      console.error('Invalid input or socket not connected.');
    }
  };

  const handleSellSubmit = (e) => {
    e.preventDefault();
    if (socket && shareName && price && qty) {
      socket.emit('sellOrder', {shareName, price, qty});
      console.log('Sell order submitted:', { shareName, price, qty });
    } else {
      console.error('Invalid input or socket not connected.');
    }
  };

  const toggleBuy = () => setBuy(!buy);

  const data = {
    labels: ['', '', '', '','', '', '', '','', '', '','','','','','','','',''],
    datasets: [
      {
        label: 'Price Trend',
        data: [101.6, 96.0, 96.0, 96.0, 96.0, 96.0, 96.0, 101.4, 98.0, 98.8,97.7,99.3,100.9,100.1,102.3,99.9,99.7,101.3],
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
    maintainAspectRatio: false
  };

  return (
    <div className="primary-flex mar-main-extra">
      <div className="float-10" />
      <div className="primary-flex flex-col float-55">
        <img src="//assets-netstorage.groww.in/web-assets/billion_groww_desktop/prod/_next/static/media/O.5307e6f8.svg" alt="Logo" className="logo-img-stk back-white-round"/>
        <div className="primary-flex flex-col">
          <span className="font-roboto whiten text-enlarge mar-bottom">{shareName}</span>
          <div className="primary-flex align-center">
            <span className="font-roboto whiten text-enlarge mar-right">{Marketvalue}</span>
            <span className="font-roboto active">+3.00 (3.01%)</span>
          </div>
          <div style={{ height: '200px', width: '100%' }} className="mar-top">
            <Line data={data} options={options} />
          </div>
        </div>
      </div>

      <div className="float-35 primary-flex flex-col align-center">
        <div className="sell-buy-box primary-flex flex-col">
          <div className="price-box">
            <div className="font-roboto whiten primary-flex flex-col mar-left">
              <span>Ola Electric Mobility</span>
              <span className="font-small">{`ISE - ₹102.62`}</span>
            </div>
          </div>
          <div className="primary-flex border-bottom">
            <button className={`padding-sml mar-top-sml ${buy ? 'make-active' : ''}`} id="buy" onClick={toggleBuy}>BUY</button>
            <button className={`padding-sml mar-top-sml ${!buy ? 'make-active' : ''}`} id="sell" onClick={toggleBuy}>SELL</button>
          </div>

          <form className="primary-grid">
            <div className="primary-flex font-roboto padding-sml transform-down">
              <span className="whiten float-50 transform-down">Quantity</span>
              <div className="float-50 primary-flex justify-end mar-right">
                <input type="text" className="inpt" name="qty" value={qty} onChange={(e) => setQty(e.target.value)}/>
              </div>
            </div>
            <div className="primary-flex font-roboto padding-sml">
              <span className="whiten float-50">Price</span>
              <div className="float-50 primary-flex justify-end mar-right">
                <input type="text" className="inpt" placeholder="At Market" name="price" value={price} onChange={(e) => setPrice(e.target.value)}/>
              </div>
            </div>
            <div className="height-main" />
            {buy ? (
              <button type="submit" className="order-placer" onClick={handleBuySubmit}>BUY</button>
            ) : (
              <button type="button" className="order-placer-sell" onClick={handleSellSubmit}>SELL</button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
