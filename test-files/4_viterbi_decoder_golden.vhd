library ieee;
use ieee.std_logic_1164.all;

entity ViterbiDecoder is
    port (
        input : in std_logic_vector(1 downto 0);
        clk : in std_logic;
        output : out std_logic
    );
end ViterbiDecoder;

architecture ViterbiDecoder_behav of ViterbiDecoder is
    type word_2 is array (1 downto 0) of std_logic_vector(1 downto 0);
    type word_4_NextState is array (3 downto 0) of std_logic_vector(1 downto 0);
    type word_3 is array (2 downto 0) of std_logic_vector(1 downto 0);
    type word_3_std is array (2 downto 0) of std_logic;
    type word_4 is array (3 downto 0) of integer;
    type word_4_std is array (3 downto 0) of std_logic;
    type memory_4 is array (3 downto 0) of word_2;
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
                return -1;
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
                return -1;
        end case;
    end conv_int;

begin
    process(clk)
        variable InitialState : std_logic_vector(1 downto 0) := "00";
        variable TracebackResult : memory_8 := (0, 0, 0, 0, 0, 0, 0, 0);
        variable InputLevel : integer := 0;
        variable i : integer := 0;
        variable chosenPathIndex : integer;
        variable lowestPathMetricError : integer := 6;
        variable currentState : std_logic_vector(1 downto 0);
        variable outputVector : word_3_std;
        variable temp_output : std_logic_vector(1 downto 0);
    begin
        if rising_edge(clk) and input /= "UU" then
            i := 0;

            while i < 8 loop
                TracebackResult(i) := TracebackResult(i) + hammingDistance(traceback_table(3 - conv_int(InitialState))(7 - i)(2 - InputLevel) xor input);
                i := i + 1;
            end loop;

            output <= outputVector(InputLevel);

            InputLevel := InputLevel + 1;
            if InputLevel = TraceBackDepth then
                i := 0;
                while i < 8 loop
                    if lowestPathMetricError > TracebackResult(i) then
                        lowestPathMetricError := TracebackResult(i);
                        chosenPathIndex := i;
                    end if;
                    i := i + 1;
                end loop;

                currentState := InitialState;
                i := 0;
                while i < TraceBackDepth loop
                    temp_output := traceback_table(3 - conv_int(InitialState))(7 - chosenPathIndex)(2 - i);
                    outputVector(i) := outputTable(3 - conv_int(currentState))(3 - conv_int(temp_output));
                    currentState := nextStateTable(3 - conv_int(currentState))(3 - conv_int(temp_output));
                    i := i + 1;
                end loop;

                InitialState := currentState;

                InputLevel := 0;
                TracebackResult := (0, 0, 0, 0, 0, 0, 0, 0);
                lowestPathMetricError := 6;
            end if;
        end if;
    end process;
end ViterbiDecoder_behav;