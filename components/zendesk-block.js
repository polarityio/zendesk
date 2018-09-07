'use strict';

polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  timezone: Ember.computed('Intl', function() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }),
  showEmail: Ember.computed('details.length', function() {
    const detailsLength = this.get('details.length');
    const viewState = Ember.A();
    for (let i = 0; i < detailsLength; i++) {
      viewState.push(false);
    }
    return viewState;
  }),
  actions: {
    toggleVisibility(index) {
      this.toggleProperty('showEmail.' + index);
    }
  }
});
