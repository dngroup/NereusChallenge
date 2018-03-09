var nereusMOSService = (function() {

    /**
     * stats --> list of:
     
                bandwidthEstimated:2988.816
                decision: decision
                duration:6
                quality:1
                sessionId:"29050371-d29b-447a-8222-edd027f0fa79"
                success:true
                url:"http://server3iface11.mddash.net/api/description/zjaOgN2Uti8/1?order=000000001111&q0=398501&q1=992539"
     * 
     * 
     * decision --> object with:
     
                bitratelist:(12) [_0x6529xdab, _0x6529xdab, _0x6529xdab, _0x6529xdab, _0x6529xdab, _0x6529xdab, _0x6529xdab, _0x6529xdab, _0x6529xdab, _0x6529xdab, _0x6529xdab, _0x6529xdab]
                lowQuality:398501
                maxQuality:992539
                maxQualityNumber:1
                numberOfQualities:12
                order:"000000001111"
                percent:33.33333333333334
                server:"http://server3iface11.mddash.net/api/description/zjaOgN2Uti8/"
     * 
     * 
     * emptyBufferEvents --> list of:
     
                            date_begin:1520612651989
                            date_end:1520612652264
                            duration:275
     * 
     */

    function functionExample1() {
        var stats = this.stats;
        var emptyBufferEvents = this.emptyBufferEvents;

        return 5;
    }
    
    
    
    
    
    
    
    
    return {
        stats: [],
        emptyBufferEvents: [],
        postEmptyBufferEvents: function(emptyBufferEvent) {
            this.emptyBufferEvents.push(emptyBufferEvent);
        },
        putEmptyBufferEvents: function(emptyBufferEvent) {
            this.emptyBufferEvents[this.emptyBufferEvents.length - 1] = emptyBufferEvent;
        },
        postStats: function(stat) {
            this.stats.push(stat);
        },
        computeMOS: function() {
            var MOSValue;
            MOSValue = functionExample1.bind(this)();
            return MOSValue;
        }
    }
});