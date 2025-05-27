import {InfoDisplay} from "./infoDisplay.js";


export class DonateMenu extends InfoDisplay {
    
    constructor(contentName) {
        super(contentName);
        const BTCaddress = "bc1q4xr9agec3ldug0xezqxy252y3kvqmcz62xr6pm";
        this.donateBTCButton = new CopyWalletButton("BTC", BTCaddress);
        const ETHaddress = "0xaFE3DB130E71404Ed038397D25C26777d4EC8e4F";
        this.donateETHButton = new CopyWalletButton("ETH",ETHaddress);
    }

}

class CopyWalletButton {
    constructor(crypto, walletAddress) {
        this.walletAddress = walletAddress;
        this.copyButton = document.getElementById("copy" + crypto + "WalletAddressBtn").addEventListener("click", () => {
            navigator.clipboard.writeText(this.walletAddress);
            // Show feedback popup
            const feedback = document.getElementById("copy-feedback");
            feedback.classList.add("visible");

            // Hide the popup after 2 seconds
            setTimeout(() => {
                feedback.classList.remove("visible");
            }, 1000);
        });
    }
}