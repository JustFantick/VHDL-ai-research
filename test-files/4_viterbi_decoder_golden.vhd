library ieee;
use ieee.std_logic_1164.all;

entity ViterbiDecoder is
    port (
        input : in std_logic_vector(1 downto 0);
        clk : in std_logic;
        rst : in std_logic;
        output : out std_logic
    );
end ViterbiDecoder;

architecture ViterbiDecoder_behav of ViterbiDecoder is
    type word_4_NextState is array (3 downto 0) of std_logic_vector(1 downto 0);
    type word_3 is array (2 downto 0) of std_logic_vector(1 downto 0);
    type word_3_std is array (2 downto 0) of std_logic;
    type word_4_std is array (3 downto 0) of std_logic;
    type memory_4_std is array (3 downto 0) of word_4_std;
    type memory_4_NextState is array (3 downto 0) of word_4_NextState;
    type memory_8 is array (7 downto 0) of integer;
    type memory_traceback_row is array (7 downto 0) of word_3;
    type memory_traceback_table is array (3 downto 0) of memory_traceback_row;

    constant traceback_table : memory_traceback_table := (
        (("00", "00", "00"), ("11", "10", "11"), ("00", "11", "10"), ("11", "01", "01"), ("00", "00", "11"), ("11", "10", "00"), ("00", "11", "01"), ("11", "01", "10")),
        (("11", "00", "00"), ("00", "10", "11"), ("11", "11", "10"), ("00", "01", "01"), ("11", "00", "11"), ("00", "10", "00"), ("11", "11", "01"), ("00", "01", "10")),
        (("10", "11", "00"), ("01", "01", "11"), ("10", "00", "10"), ("01", "10", "01"), ("10", "11", "11"), ("01", "01", "00"), ("10", "00", "01"), ("01", "10", "10")),
        (("01", "11", "00"), ("10", "01", "11"), ("01", "00", "10"), ("10", "10", "01"), ("01", "11", "11"), ("10", "01", "00"), ("01", "00", "01"), ("10", "10", "10"))
    );

    constant outputTable : memory_4_std := (
        ('0', '0', '0', '1'),
        ('1', '0', '0', '0'),
        ('0', '1', '0', '0'),
        ('0', '0', '1', '0')
    );

    constant nextStateTable : memory_4_NextState := (
        ("00", "00", "00", "10"),
        ("10", "00", "00", "00"),
        ("00", "11", "01", "00"),
        ("00", "01", "11", "00")
    );

    constant TraceBackDepth : positive := 3;

    function hammingDistance(a : std_logic_vector(1 downto 0)) return integer is
    begin
        case a is
            when "00" =>
                return 0;
            when "01" =>
                return 1;
            when "10" =>
                return 1;
            when "11" =>
                return 2;
            when others =>
                assert false report "hammingDistance: invalid input" severity error;
                return 0;
        end case;
    end hammingDistance;

    function conv_int(a : std_logic_vector(1 downto 0)) return integer is
    begin
        case a is
            when "00" =>
                return 0;
            when "01" =>
                return 1;
            when "10" =>
                return 2;
            when "11" =>
                return 3;
            when others =>
                assert false report "conv_int: invalid input" severity error;
                return 0;
        end case;
    end conv_int;

begin
    process(clk, rst)
        variable InitialState : std_logic_vector(1 downto 0) := "00";
        variable TracebackResult : memory_8 := (others => 0);
        variable InputLevel : integer range 0 to TraceBackDepth - 1 := 0;
        variable chosenPathIndex : integer range 0 to 7 := 0;
        variable lowestPathMetricError : integer range 0 to 2 * TraceBackDepth := 0;
        variable currentState : std_logic_vector(1 downto 0) := "00";
        variable outputVector : word_3_std := (others => '0');
        variable temp_output : std_logic_vector(1 downto 0) := "00";
        variable state_index : integer range 0 to 3 := 0;
        variable symbol_index : integer range 0 to 3 := 0;
    begin
        if rst = '1' then
            InitialState := "00";
            TracebackResult := (others => 0);
            InputLevel := 0;
            chosenPathIndex := 0;
            lowestPathMetricError := 0;
            currentState := "00";
            outputVector := (others => '0');
            temp_output := "00";
            state_index := 0;
            symbol_index := 0;
            output <= '0';
        elsif rising_edge(clk) then
            state_index := 3 - conv_int(InitialState);
            for i in 0 to 7 loop
                TracebackResult(i) := TracebackResult(i) + hammingDistance(traceback_table(state_index)(7 - i)(2 - InputLevel) xor input);
            end loop;

            output <= outputVector(InputLevel);

            if InputLevel = TraceBackDepth - 1 then
                lowestPathMetricError := 2 * TraceBackDepth;
                for i in 0 to 7 loop
                    if lowestPathMetricError > TracebackResult(i) then
                        lowestPathMetricError := TracebackResult(i);
                        chosenPathIndex := i;
                    end if;
                end loop;

                currentState := InitialState;
                for i in 0 to TraceBackDepth - 1 loop
                    state_index := 3 - conv_int(currentState);
                    temp_output := traceback_table(state_index)(7 - chosenPathIndex)(2 - i);
                    symbol_index := 3 - conv_int(temp_output);
                    outputVector(i) := outputTable(state_index)(symbol_index);
                    currentState := nextStateTable(state_index)(symbol_index);
                end loop;

                InitialState := currentState;
                InputLevel := 0;
                TracebackResult := (others => 0);
            else
                InputLevel := InputLevel + 1;
            end if;
        end if;
    end process;
end ViterbiDecoder_behav;