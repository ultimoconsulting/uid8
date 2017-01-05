$(function () {
	var $window = $(window),
		elementHelper,
		START_STATUS = 'start',
		END_STATUS = 'end',
		IN_PROGRESS_STATUS = 'in progress';

	function AnimationCollection(list) {
		this.initialize(list);
	}

	AnimationCollection.prototype = {
		initialize: function (list) {
			this.elements = list || [];
		},
		add: function (animation) {
			this.elements.push(animation);
		},
		getNotStartedBefore: function (start) {
			return new AnimationCollection(this.elements.filter(function (animation) {
				return animation.isNotStartedBefore(start);
			}));
		},
		start: function () {
			this.elements.forEach(function (animation) {
				animation.putOnStart();
			})
		},
		getInProgress: function (value) {
			return new AnimationCollection(this.elements.filter(function (animation) {
				return animation.isInProgress(value);
			}));
		},
		animate: function (value) {
			this.elements.forEach(function (animation) {
				animation.animate(value);
			})
		},
		getEndedBefore: function (end) {
			return new AnimationCollection(this.elements.filter(function (animation) {
				return animation.isEndedBefore(end);
			}));
		},
		end: function () {
			this.elements.forEach(function (animation) {
				animation.putOnEnd();
			})
		}
	};

	function Animation(data) {
		this.initialize(data);
	}
	
	Animation.prototype = {
		initialize: function (data) {
			this.start = data.start;
			this.end = data.end;
			this.what = data.what;
			this.from = data.from;
			this.to = data.to;
			this.decorator = data.decorator;
			this.$element = data.element;
		},
		isNotStartedBefore: function (start) {
			return this.start >= start;
		},
		putOnStart: function () {
			this.setFrame(this.from);
		},
		isInProgress: function (value) {
			return this.start < value && value < this.end;
		},
		animate: function (value) {
			var ratio = (value - this.start) / (this.end - this.start);
			this.setFrame(this.from + ratio * (this.to - this.from));
		},
		isEndedBefore: function (end) {
			return this.end <= end;
		},
		putOnEnd: function () {
			this.setFrame(this.to);
		},
		setFrame: function (value) {
			this.$element.css(this.what, this.decorator.replace(/\{x\}/g, value));
		}
	};

	function Presentation(dataParam, $wrapper, $container) {
		this.initialize(dataParam, $wrapper, $container);
	}

	Presentation.prototype = {
		$wrapper: undefined,
		$container: undefined,
		animations: undefined,
		status: START_STATUS,
		getAnimations: function (dataParam, wrapper) {
			var $elementsToAnimate = $('[' + dataParam + ']', wrapper),
				animations = new AnimationCollection();

			$elementsToAnimate.each(function () {
				var $element = $(this);
				this.getAttribute(dataParam).split(/\|/).forEach(function (animationData) {
					var animationDataParts = animationData.split(/\s+/),
						from = Number(animationDataParts[3]),
						to = Number(animationDataParts[4]);
					animations.add(new Animation({
						start: Number(animationDataParts[0]) || 0,
						end: Number(animationDataParts[1]) || 100,
						what: animationDataParts[2] || 'opacity',
						from: window.isNaN(from) ? 1 : from,
						to: window.isNaN(to) ? 0 : to,
						decorator: animationDataParts[5] || '{x}',
						element: $element
					}));
				});
			});
			return animations;
		},
		getAnimationPercentage: function () {
			var start = this.animationScrollPositionStart,
				end = this.animationScrollPositionEnd,
				scrollPosition = elementHelper.getScrollPosition(),
				percent = (scrollPosition - start) * 100 / (end - start);

			return Math.max(0, Math.min(100, percent));
		},
		isAnimationActive: function () {
			return this.$container.css('position') === 'fixed';
		},
		fixContainer: function () {
			var $container = this.$container,
				offset;
			if (this.isAnimationActive()) {
				return;
			}
			this.unfixContainer();
			this.setAnimationFrame(0);

			offset = elementHelper.getElementOffset($container);
			$container.css({
				position: 'fixed',
				top: (offset.top - this.animationScrollPositionStart) + 'px',
				left: offset.left + 'px',
				bottom: ''
			});
		},
		unfixContainer: function (atBottom) {
			var $container = this.$container,
				$wrapper = this.$wrapper;
			if (atBottom) {
				var wRect = $wrapper[0].getBoundingClientRect(),
					cRect = $container[0].getBoundingClientRect();
				$container.css({
					position: 'absolute',
					top: '',
					left: cRect.left - wRect.left + 'px',
					bottom: wRect.bottom - cRect.bottom + 'px'
				});
			} else {
				$container.css({
					position: '',
					top: '',
					left: '',
					bottom: ''
				});
			}
		},
		setAnimationFrame: function (percent) {
			this.animations.getNotStartedBefore(percent).start();
			this.animations.getEndedBefore(percent).end();
			this.animations.getInProgress(percent).animate(percent);
		},
		refresh: function () {
			var animationPercentage = this.getAnimationPercentage();

			console.log(animationPercentage);
			if (animationPercentage > 0 && animationPercentage < 100) {
				this.fixContainer();
				this.setAnimationFrame(animationPercentage);
				this.status = IN_PROGRESS_STATUS;
			} else if (animationPercentage >= 100) {
				if (this.isAnimationActive() || this.status !== END_STATUS) {
					this.animations.end();
					this.status = END_STATUS;
					this.unfixContainer(true);
				}
			} else if (this.isAnimationActive() || this.status !== START_STATUS) {
				// animacja na poziomie 0
				this.animations.start();
				this.status = START_STATUS;
				this.unfixContainer();
			}
		},
		attachEvents: function () {
			var animation = this;
			$window.on({
				'scroll.scrollAnimation': function () {
					animation.refresh();
				}
			})
		},
		detachEvents: function () {
			$window.off('.scrollAnimation');
		},
		initialize: function (dataParam, $wrapper, $container) {
			this.$wrapper = $wrapper;
			this.$container = $container;
			this.animations = this.getAnimations(dataParam);
			console.log(this.animations);
		},
		getAnimationBoundaries: function () {
			var $container = this.$container,
				containerCenter = elementHelper.getElementCenter($container),
				windowCenter = elementHelper.getWindowCenter();

			this.animationScrollPositionStart = containerCenter - windowCenter;
			this.animationScrollPositionEnd = this.animationScrollPositionStart + this.$wrapper.height() - $container.height();
		},
		start: function () {
			this.getAnimationBoundaries();
			this.attachEvents();
		},
		stop: function () {
			this.detachEvents();
		}
	};

	elementHelper = {
		getElementCenter: function ($element) {
			var offset = this.getElementOffset($element);
			return offset.top + $element.height() / 2;
		},
		getWindowCenter: function () {
			return $window.height() / 2;
		},
		getScrollPosition: function () {
			return $window.scrollTop();
		},
		getElementOffset: function ($element) {
			return $element.offset();
		}
	};

	$('[data-scroll-animation-element="wrapper"]').each(function () {
		var $wrapper = $(this),
			$container = $('[data-scroll-animation-element="container"]', this);
			animation = window.animation = new Presentation('data-scroll-animation', $wrapper, $container);
		animation.start();
		$window.on('load', function () {
			animation.refresh();
		});
	});
});