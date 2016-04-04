'use strict';

const Promise = require('bluebird');
const nmap = Promise.promisifyAll(require('libnmap'));
const winston = require('winston');

/**
 * This class can be used to scan local network to find the boxes
 * Use the run method to scan the local network
 */
class BoxFinder {
    /**
     * Construct the box finder
     * @param {Number} port - port we are currently scanning
     * @param {String} baseIP - The local adress ip patten (ex: 192.168.1)
     * @param {String} macConstructorAddress - Mac address part of the
     *   constructor
     * @param {Number} rangeStart - Where we start to scan (0 to 255)
     * @param {Number} rangeEnd - Where we stop to scan (0 to 255)
     * @param {Number} [step] - Number of boxes by check range (time optimizer),
     *   default setting is one range
     */
    constructor(port, baseIP, macConstructorAddress, rangeStart, rangeEnd, step) {
        this.regBox = new RegExp(`${macConstructorAddress}:..`);
        this.opts = {
            ports: port,
            range: []
        };
        if (rangeStart > rangeEnd) {
            winston.log('warn',
                'Starting range must be superior to end range, swapping it');
            //[rangeStart, rangeEnd] = [rangeEnd, rangeStart]; for es6 destructuring
            let tmp = rangeEnd;
            rangeEnd = rangeStart;
            rangeStart = tmp;
        }
        step = step || rangeEnd - rangeStart;
        this.InitRanges(baseIP, rangeStart, rangeEnd, step);
        this.boxes = [];
    }

    /**
     * Initialize the opts ranges
     * @param {String} baseIP - The local adress ip patten (ex: 192.168.1)
     * @param {Number} rangeStart - Where we start to scan (0 to 255)
     * @param {Number} rangeEnd - Where we stop to scan (0 to 255)
     * @param {Number} [step] - Number of boxes by check range (time optimizer),
     *   default setting is one range
     */
    InitRanges(baseIP, rangeStart, rangeEnd, step) {
        this.totalRanges = Math.ceil((rangeEnd - rangeStart) / step);
        let currentRangeEnd = rangeStart;
        for (let range = 0; range < this.totalRanges; range++) {
            rangeStart = currentRangeEnd + 1;
            currentRangeEnd =
                (currentRangeEnd + step > rangeEnd) ? rangeEnd : currentRangeEnd + step;
            this.opts.range.push(`${baseIP}.${rangeStart}-${currentRangeEnd}`);
        }
    }

    /**
     * Runs the scan, and store the box in the boxes Array
     * @returns {Promise} - The resolve has no parameters and is triggered when
     *   the nmap is finished
     */
    Run() {
        return new Promise((resolve, reject) => {
            nmap.scanAsync(this.opts).then((report) => {
                for (let rangeReport in report) {
                    if (report.hasOwnProperty(rangeReport)) {
                        if (report[rangeReport].host) {
                            report[rangeReport].host.forEach((host) => { //jshint ignore:line
                                if (this.isBox(host.address[1])) {
                                    this.boxes.push(host.address[0].item.addr);
                                }
                            });
                        }
                    }
                }
                resolve();
            }).catch(err => reject(err));
        });
    }

    /**
     * Check if the host is a box
     * @param {Object} hostAddress - The address item containing the mac address
     * @returns {bool} - true if host is a box, else false
     */
    isBox(hostAddress) {
        return hostAddress && hostAddress.item.addr.match(this.regBox);
    }

    getBoxes() {
        return this.boxes;
    }
}

module.exports.BoxFinder = BoxFinder;

// var b = new BoxFinder(22, '192.168.1', '08:03:71:00', 0, 255, 10);
// b.Run()
//   .then(() => console.log(b.getBoxes()))
//   .catch(err => console.log(err));
