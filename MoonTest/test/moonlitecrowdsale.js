var MoonliteTokenCrowdsale = artifacts.require("./MoonliteTokenCrowdsale.sol");
var MoonliteToken = artifacts.require("./MoonliteToken.sol");

const timeTravel = function (time) {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [time], // 86400 is num seconds in day
      id: new Date().getTime()
    }, (err, result) => {
      if(err){ return reject(err) }
      return resolve(result)
    });
  })
}

const mineBlock = function () {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: "2.0",
      method: "evm_mine"
    }, (err, result) => {
      if(err){ return reject(err) }
      return resolve(result)
    });
  })
}

const toDec = 10**2;//toDec on the contract must match for test to work.

contract('MoonliteTokenCrowdsale', function(accounts) {
  
  it("buy should fail before start", async function() {
    let cs = await MoonliteTokenCrowdsale.deployed();
    let tkadr = await cs.token.call();
    let tk = await MoonliteToken.at(tkadr);
    try {
      await cs.buyTokens(accounts[2], {from:accounts[2], value: 500000*toDec});
    } catch (e) {
      return true;
    }
    throw new Error("I should never see this!")
  });

  it("should have correct start balance", async function() {
    let cs = await MoonliteTokenCrowdsale.deployed();
    let tkadr = await cs.token.call();
    let tk = await MoonliteToken.at(tkadr);
    let acc1balb4 = await tk.balanceOf.call(accounts[1]);
    let acc2balb4 = await tk.balanceOf.call(accounts[2]);
    let acc3balb4 = await tk.balanceOf.call(accounts[3]);
    let acc4balb4 = await tk.balanceOf.call(accounts[4]);
    let acc6balb4 = await tk.balanceOf.call(accounts[7]);
    let acc7balb4 = await tk.balanceOf.call(accounts[8]);
    let acc8balb4 = await tk.balanceOf.call(accounts[9]);
    
    assert.equal(acc1balb4.c[0], 25000000*toDec, "start sum 1 wrong");
    assert.equal(acc2balb4.c[0], 3000000*toDec, "start sum 2 wrong");
    assert.equal(acc3balb4.c[0], 3000000*toDec, "start sum 3 wrong");
    assert.equal(acc4balb4.c[0], 3000000*toDec, "start sum 4 wrong");
    assert.equal(acc6balb4.c[0], 1000000*toDec, "start sum 5 wrong");
    assert.equal(acc7balb4.c[0], 800000*toDec, "start sum 6 wrong");
    assert.equal(acc8balb4.c[0], 200000*toDec, "start sum 7 wrong");
  });

  it("should have correct start rate", async function() {
    let cs = await MoonliteTokenCrowdsale.deployed();
    let tkadr = await cs.token.call();
    let tk = await MoonliteToken.at(tkadr);
    let state = await cs.state.call();
    await timeTravel(2*86400 - 3*3600);
    await mineBlock();
    let acc1balb4 = await tk.balanceOf.call(accounts[6]);
    await cs.buyTokens(accounts[6], {from:accounts[6], value: 8500*toDec});
    let acc1balafter = await tk.balanceOf.call(accounts[6]);
    var expected = acc1balb4.c[0] + 8500*1000*toDec;
    assert.equal(acc1balafter.c[0], expected, "bonus wrong");
  });

  it("should not allow with less then 0.1 ether", async function() {
    let cs = await MoonliteTokenCrowdsale.deployed();
    let tkadr = await cs.token.call();
    let tk = await MoonliteToken.at(tkadr);
    try {
      await cs.buyTokens(accounts[6], {from:accounts[6], value:toDec/12});
    } catch (e) {
      return true;
    }
    throw new Error("I should never see this!")
  });

  it("should have correct no bonus rate", async function() {
    let cs = await MoonliteTokenCrowdsale.deployed();
    let tkadr = await cs.token.call();
    let tk = await MoonliteToken.at(tkadr);
    await timeTravel(86400 * 1);
    await mineBlock();
    let acc1balb4 = await tk.balanceOf.call(accounts[7]);
    let sendamount = 12300*toDec;
    console.log(sendamount);
    await cs.buyTokens(accounts[7], {from:accounts[7], value:sendamount});
    let acc1balafter = await tk.balanceOf.call(accounts[7]);
    let expected = acc1balb4.c[0] + 12300*500*toDec;
    assert.equal(acc1balafter.c[0], expected, "normal rate wrong");
  });

  it("should not allow withdrawing lockup during sale", async function() {
    let cs = await MoonliteTokenCrowdsale.deployed();
    let tkadr = await cs.token.call();
    let tk = await MoonliteToken.at(tkadr);
    try {
      await cs.withdrawLockupTokens({from:accounts[0]});
    } catch (e) {
      return true;
    }
    throw new Error("I should never see this!")
  });

  it("should not allow finalizing early", async function() {
    let cs = await MoonliteTokenCrowdsale.deployed();
    let tkadr = await cs.token.call();
    let tk = await MoonliteToken.at(tkadr);
    try {
      await cs.finalize({from:accounts[0]});
    } catch (e) {
      return true;
    }
    throw new Error("I should never see this!")
  });

  /* ------ Suite 1 - on time ------ */

  it("should allow finalizing after sale", async function() {
    var accountZeroBalance = 0;
    let cs = await MoonliteTokenCrowdsale.deployed();
    let tkadr = await cs.token.call();
    let tk = await MoonliteToken.at(tkadr);

    await timeTravel(86400 * 31);
    await mineBlock();
    await cs.finalize({from:accounts[4]});
    await mineBlock();
    var finalizesCorrectly = await cs.state.call();
    assert.equal(finalizesCorrectly.toNumber(), 4, "buy fails after sale");
  });

  it("should not allow withdrawing lockup during break", async function() {
    let cs = await MoonliteTokenCrowdsale.deployed();
    let tkadr = await cs.token.call();
    let tk = await MoonliteToken.at(tkadr);
    try {
      await cs.withdrawLockupTokens({from:accounts[0]});
    } catch (e) {
      return true;
    }
    throw new Error("I should never see this!")
  });

  it("should allow withdrawing lockup tokens after period", async function() {
    let cs = await MoonliteTokenCrowdsale.deployed();
    let tkadr = await cs.token.call();
    let tk = await MoonliteToken.at(tkadr);

    await timeTravel(86400 * 182);
    await mineBlock();
    let acc1balb4 = await tk.balanceOf.call(accounts[5]);
    
    await cs.withdrawLockupTokens({from:accounts[0]});
    
    let acc1balaft = await tk.balanceOf.call(accounts[5]);

    console.log(acc1balb4);
    console.log(acc1balaft);
    
    assert.equal(acc1balaft.c[0], acc1balb4.c[0] + 5000000*toDec, "1 lockup withdrawn incorrectly");
  });

  it("should end up with (total baught + predefined)*toDec total supply", async function() {
    var accountZeroBalance = 0;
    let cs = await MoonliteTokenCrowdsale.deployed();
    let tkadr = await cs.token.call();
    let tk = await MoonliteToken.at(tkadr);

    let acc0balb4 = await tk.balanceOf.call(accounts[0]);
    let acc1balb4 = await tk.balanceOf.call(accounts[1]);
    let acc2balb4 = await tk.balanceOf.call(accounts[2]);
    let acc3balb4 = await tk.balanceOf.call(accounts[3]);
    let acc4balb4 = await tk.balanceOf.call(accounts[4]);
    let acc5balb4 = await tk.balanceOf.call(accounts[5]);
    let acc6balb4 = await tk.balanceOf.call(accounts[6]);
    let acc7balb4 = await tk.balanceOf.call(accounts[7]);
    let acc8balb4 = await tk.balanceOf.call(accounts[8]);
    let acc9balb4 = await tk.balanceOf.call(accounts[9]);
    console.log(acc0balb4);
    console.log(acc1balb4);
    console.log(acc2balb4);
    console.log(acc3balb4);
    console.log(acc4balb4);
    console.log(acc5balb4);
    console.log(acc6balb4);
    console.log(acc7balb4);
    console.log(acc8balb4);
    console.log(acc9balb4);
    var totalBaught = 8500*1000 + 12300*500;
    var predefined = 25000000 + 3000000 + 3000000 + 3000000 + 5000000 + 1000000 + 800000 + 200000;
    var expected = (totalBaught + predefined)*toDec;
    var tot = acc0balb4.c[0] + acc1balb4.c[0] + acc2balb4.c[0] + acc3balb4.c[0] + acc8balb4.c[0] + acc9balb4.c[0];
    tot = tot + acc4balb4.c[0] + acc5balb4.c[0] + acc6balb4.c[0] + acc7balb4.c[0];
    assert.equal(tot, expected, "final total supply incorrect");
    
  });
  /* ------ Suite 2 - finish early ------ */
  //  const lastTokens = 61000000 - (8500*1000 + 12300*500);
  //  const overflow = 33;
  //  const lastFinal = (lastTokens*toDec);
   

  // it("should succeed within limit", async function() {
  //   let cs = await MoonliteTokenCrowdsale.deployed();
  //   let tkadr = await cs.token.call();
  //   let tk = await MoonliteToken.at(tkadr);
  //   console.log("total supply:");
  //   let sup1 = await tk.totalSupply.call();
  //   console.log(sup1);
  //   await cs.buyTokens(accounts[7], {from:accounts[7], value: lastFinal + overflow});
  //   await mineBlock();
  //   console.log("total supply:");
  //   let sup2 = await tk.totalSupply.call();
  //   console.log(sup2);
  //   let diff = sup2.toNumber() - sup1.toNumber()

  //   assert.equal(diff, lastFinal, "pass limit gave wrong amount");
  // });

  // it("should fail after limit", async function() {
  //   let cs = await MoonliteTokenCrowdsale.deployed();
  //   let tkadr = await cs.token.call();
  //   let tk = await MoonliteToken.at(tkadr);
  //   var buyFailsAfterSale = false;
  //   var amount = 2*toDec;
  //   let acc1balb4 = await tk.balanceOf.call(accounts[6]);
  //   let supb4 = await tk.totalSupply.call();
  //   await mineBlock();
  //   try {
  //     await cs.buyTokens(accounts[6], {from:accounts[6], value: amount});
  //   } catch (e) {
  //     buyFailsAfterSale = true;
  //     console.log("buy fails after limit");
  //   }
  //   await mineBlock();
  //   let acc1balafter = await tk.balanceOf.call(accounts[6]);
  //   console.log("total supply:");
  //   let sup = await tk.totalSupply.call();
  //   console.log(sup);
  //   assert.equal(buyFailsAfterSale, true, "buy fails after sale");
  // });

  // it("should finalize after limit", async function() {
  //   let cs = await MoonliteTokenCrowdsale.deployed();
  //   let tkadr = await cs.token.call();
  //   let tk = await MoonliteToken.at(tkadr);
  //   await cs.finalize({from:accounts[0]});
  //   await mineBlock();
  //   var finalizesCorrectly = await cs.state.call();
  //   assert.equal(finalizesCorrectly.toNumber(), 4, "buy fails after sale");
  // });

  // it("should lock during break for minting and withdrawing lockup", async function() {
  //   let cs = await MoonliteTokenCrowdsale.deployed();
  //   let tkadr = await cs.token.call();
  //   let tk = await MoonliteToken.at(tkadr);
  //   var withdrawFailsDuringBreak = false;

  //   try {
  //     await cs.withdrawLockupTokens({from:accounts[0]});
  //   } catch (e) {
  //     withdrawFailsDuringBreak = true;
  //   }

  //   await timeTravel(86400 * 182);//lock time should run out
  //   await mineBlock();
    
  //   try {
  //     await cs.withdrawLockupTokens({from:accounts[0]});
  //   } catch (e) {
  //     console.log("withdrawing failed on time");
  //   }
  //   assert.equal(withdrawFailsDuringBreak, true, "withdraw lockup succeeds during break");
  // });

  // it("should end up with 100000000*toDec total supply", async function() {
  //   var accountZeroBalance = 0;
  //   let cs = await MoonliteTokenCrowdsale.deployed();
  //   let tkadr = await cs.token.call();
  //   let tk = await MoonliteToken.at(tkadr);
  //   let acc0balb4 = await tk.balanceOf.call(accounts[0]);
  //   let acc1balb4 = await tk.balanceOf.call(accounts[1]);
  //   let acc2balb4 = await tk.balanceOf.call(accounts[2]);
  //   let acc3balb4 = await tk.balanceOf.call(accounts[3]);
  //   let acc4balb4 = await tk.balanceOf.call(accounts[4]);
  //   let acc5balb4 = await tk.balanceOf.call(accounts[5]);
  //   let acc6balb4 = await tk.balanceOf.call(accounts[6]);
  //   let acc7balb4 = await tk.balanceOf.call(accounts[7]);
  //   console.log(acc0balb4);
  //   console.log(acc1balb4);
  //   console.log(acc2balb4);
  //   console.log(acc3balb4);
  //   console.log(acc4balb4);
  //   console.log(acc5balb4);
  //   console.log(acc6balb4);
  //   console.log(acc7balb4);
  //   var tot = acc0balb4.c[0] + acc1balb4.c[0] + acc2balb4.c[0] + acc3balb4.c[0];
  //   tot = tot + acc4balb4.c[0] + acc5balb4.c[0] + acc6balb4.c[0] + acc7balb4.c[0];
  //   console.log(tot);
  //   assert.equal(tot, 100000000*toDec, "final total supply incorrect");
  // });
});
