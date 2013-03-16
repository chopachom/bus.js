describe("Bus", function(){
	describe('get', function(){
		var get = Bus.get;
		it('should return an attribute of an object', function(){
			var obj = {x:42};
			expect(get(obj, 'x')).toBe(42)
		});
		it('should return inner attributes of an object', function(){
			var obj = {x:{y:42}, a:{b:{c:{d:42}}}};
			expect(get(obj, 'x.y')).toBe(42);
			expect(get(obj, 'a.b.c.d')).toBe(42)
		});
		it('should return undefined if attribute is not found', function(){
			var obj = {x:{y:42}};
			expect(get(obj, 'a.b.c.d')).toBe(undefined)
		});
	});
	describe("set", function(){
		var set = Bus.set;
		var get = Bus.get;
		it('should set an attribute value', function(){
			var obj = {x:42};
			set(obj, 'x', 43);
			expect(get(obj, 'x')).toBe(43)
		});
		it('should set inner attributes of an object', function(){
			var obj = {x:{y:42}, a:{b:{c:{d:42}}}};
			set(obj, 'a.b.c.d', 43);
			expect(get(obj, 'a.b.c.d')).toBe(43)
		});
		it("should set inner attributes even if objects don't exist", function(){
			var obj = {x:{y:42}};
			set(obj, 'a.b.c.d', 43);
			expect(get(obj, 'a.b.c.d')).toBe(43)
		});
	});
	describe('getPathsTree', function(){
		//TODO: what does that mean?
		var getPathsTree = Bus.getPathsTree;
		it('it should split a path and return a list containing paths needed to reach a path', function(){
			expect(getPathsTree('a')).toEqual(['a']);
			expect(getPathsTree('a.b')).toEqual(['a', 'a.b']);
			expect(getPathsTree('a.b.c')).toEqual(['a', 'a.b', 'a.b.c']);
			expect(getPathsTree('a.b.c.d')).toEqual(['a', 'a.b', 'a.b.c', 'a.b.c.d'])
		})
	});
	describe('on', function(){
		it('subscribe and fire', function(){
			var bus = new Bus.Bus;
			var context1 = {her:'monda'};
			var listener1 = jasmine.createSpy('listener1').andCallFake(function(number){
				console.log('listener1', number, this)
			});
			var listener2 = jasmine.createSpy('listener2').andCallFake(function(number){
				console.log('listener2', number, this)
			});

			bus.on('change:her.monda.anal', listener1, context1);
			bus.on('change:her.monda.anal', listener2, context1);
			bus.on('change:her.monda.anal', listener2);

			bus.trigger('change:her.monda.anal.trololo.ololo', 41);

			expect(listener1).toHaveBeenCalled();
			expect(listener1).toHaveBeenCalledWith(41);
			expect(listener1.calls[0].object).toEqual(context1);
			expect(listener2).toHaveBeenCalledWith(41);
			expect(listener2.calls.length).toEqual(2);
			expect(listener2.calls[0].object).toEqual(context1);
			expect(listener2.calls[1].object).toEqual(bus);

			bus.off('change:her.monda.anal', listener2, context1);
			bus.trigger('change:her.monda.anal.trololo.ololo', 41);

			expect(listener1.calls.length).toEqual(2);
			expect(listener1.calls[1].object).toEqual(context1);

			expect(listener2.calls.length).toEqual(3);
			expect(listener2.calls[2].object).toEqual(bus);


			bus.off('change:her.monda.anal', null, context1);
			bus.trigger('change:her.monda.anal.trololo.ololo', 42);

			expect(listener1.calls.length).toEqual(2);
			expect(listener1.calls[1].object).toEqual(context1);

			expect(listener2.calls.length).toEqual(4);
			expect(listener2.calls[3].object).toEqual(bus);

			bus.off('change:her.monda.anal', listener2);
			bus.trigger('change:her.monda.anal.trololo.ololo', 42);

			expect(listener1.calls.length).toEqual(2);
			expect(listener1.calls[1].object).toEqual(context1);

			expect(listener2.calls.length).toEqual(4);
			expect(listener2.calls[3].object).toEqual(bus);

			console.log(bus)
		});
		it("should blablabla", function(){
			var obj = {
				x:42,
				a:{
					b:{
						c:{
							d: "manda"
						}
					}
				}
			},
			get = Bus.get,
			set = Bus.set,
			on  = Bus.on;

			on(obj, 'change:x', function(value){console.log('x changed', value)});
			set(obj, 'x', 41);
			on(obj, 'change:a.b', function(value){console.log('a.b changed', value)});
			on(obj, 'change:a.b.c.d', function(value){console.log('a.b.c.d changed', value)});
			set(obj, 'a.b.c.d', 'her');
			set(obj, 'a', {b:{c:{d:32}}});

			console.log(obj)
		})
	});
//	it("should wrap an object", function(){
//		var obj = {x:42, y:'gay'};
//		var vented = Vent(obj)
//	});
});